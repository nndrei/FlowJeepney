/**
 * FlowJeep OpenWeather Integration Service & Hook
 *
 * Uses the official OpenWeather Current Weather and 5-Day / 3-Hour Forecast APIs:
 * - Current Weather: https://api.openweathermap.org/data/2.5/weather
 * - 5-Day Forecast:  https://api.openweathermap.org/data/2.5/forecast
 *
 * Implements real coordinates lookup, metric units (°C, km/h), in-memory caching,
 * and zero mock fallbacks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getManilaDateString } from '../utils/weatherDateUtils';

export interface OpenWeatherCurrentResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string; // e.g. "Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm"
    description: string; // e.g. "few clouds"
    icon: string; // e.g. "02d"
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number; // m/s
    deg?: number;
    gust?: number;
  };
  clouds?: {
    all: number; // %
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  sys: {
    country: string;
    sunrise?: number;
    sunset?: number;
  };
  name: string; // Locality / city name resolved by OpenWeather
  cod: number;
}

export interface OpenWeatherForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds?: { all: number };
    wind?: { speed: number };
    pop?: number; // Probability of precipitation (0 to 1)
    rain?: { '3h'?: number };
    dt_txt: string;
  }>;
  city?: {
    id: number;
    name: string;
    country: string;
  };
}

export type WeatherIconCategory =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rainy'
  | 'thunderstorm'
  | 'mist';

export interface FlowJeepWeatherData {
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  cloudCoveragePct: number;
  rainMm: number;
  condition: string;
  description: string;
  iconCode: string;
  iconUrl: string;
  iconType: WeatherIconCategory;
  locationName: string;
  country: string;
  dailyHighC?: number;
  dailyLowC?: number;
  precipitationProb?: number;
  lastUpdated: string;
  isLive: boolean;
  forecastDaily?: Array<{
    date: string;
    dayName: string;
    tempC: number;
    feelsLikeC: number;
    humidity: number;
    windSpeedKmh: number;
    rainMm: number;
    condition: string;
    description: string;
    iconCode: string;
    iconType: WeatherIconCategory;
  }>;
}

/**
 * Maps OpenWeather condition code and main category to Lucide icon types
 */
export function mapWeatherConditionToCategory(
  main: string,
  code: number
): WeatherIconCategory {
  const m = main.toLowerCase();
  if (code >= 200 && code < 300) return 'thunderstorm';
  if ((code >= 300 && code < 400) || (code >= 500 && code < 600)) return 'rainy';
  if (code >= 700 && code < 800) return 'mist';
  if (code === 800) return 'sunny';
  if (code === 801 || code === 802) return 'partly-cloudy';
  if (code >= 803) return 'cloudy';

  if (m.includes('rain') || m.includes('drizzle')) return 'rainy';
  if (m.includes('thunder')) return 'thunderstorm';
  if (m.includes('cloud')) return 'partly-cloudy';
  if (m.includes('clear')) return 'sunny';
  return 'partly-cloudy';
}

/**
 * Formats OpenWeather condition into a polished human-readable title
 */
export function formatWeatherCondition(main: string, description: string): string {
  if (!main) return 'Fair';
  // Capitalize first letter of each word in description if useful
  if (description) {
    return description
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return main;
}

// In-memory cache to prevent excessive API requests
const weatherCache = new Map<string, { data: FlowJeepWeatherData; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Direct fetch against OpenWeather APIs
 */
export async function fetchOpenWeatherData(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<FlowJeepWeatherData> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'your_openweather_api_key_here' || apiKey.trim() === '') {
    throw new Error('API_KEY_MISSING');
  }

  // 4 decimal places (~11 meters) ensures distinct locations don't overwrite each other
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Fetch Current Weather
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const currentRes = await fetch(currentWeatherUrl, { signal });

  if (!currentRes.ok) {
    if (currentRes.status === 401) {
      throw new Error('INVALID_API_KEY');
    }
    throw new Error(`OpenWeather API error: HTTP ${currentRes.status}`);
  }

  const currentJson: OpenWeatherCurrentResponse = await currentRes.json();
  const primaryWeather = currentJson.weather?.[0] || {
    id: 800,
    main: 'Clear',
    description: 'clear sky',
    icon: '01d',
  };

  const iconType = mapWeatherConditionToCategory(
    primaryWeather.main,
    primaryWeather.id
  );
  const conditionStr = formatWeatherCondition(
    primaryWeather.main,
    primaryWeather.description
  );

  // 2. Fetch 5-Day / 3-Hour Forecast
  let dailyHighC: number | undefined;
  let dailyLowC: number | undefined;
  let precipitationProb: number | undefined;
  const forecastDaily: FlowJeepWeatherData['forecastDaily'] = [];

  try {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    const forecastRes = await fetch(forecastUrl, { signal });
    if (forecastRes.ok) {
      const forecastJson: OpenWeatherForecastResponse = await forecastRes.json();
      if (forecastJson.list && forecastJson.list.length > 0) {
        // Compute today's high and low from the first 8 intervals (~24 hours)
        const next24h = forecastJson.list.slice(0, 8);
        const temps = next24h.map((item) => item.main.temp);
        dailyHighC = Math.round(Math.max(...temps));
        dailyLowC = Math.round(Math.min(...temps));

        // Max probability of precipitation
        const pops = next24h
          .map((item) => (item.pop !== undefined ? Math.round(item.pop * 100) : 0));
        precipitationProb = Math.max(0, ...pops);

        // Group into daily forecast by Asia/Manila calendar date
        const manilaHourFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          hour12: false,
        });

        const dailyMap = new Map<string, Array<{ item: (typeof forecastJson.list)[0]; mHour: number }>>();
        for (const item of forecastJson.list) {
          const mDate = getManilaDateString(item.dt);
          const dt = new Date(item.dt * 1000);
          const mHour = parseInt(manilaHourFmt.format(dt), 10);
          if (!dailyMap.has(mDate)) {
            dailyMap.set(mDate, []);
          }
          dailyMap.get(mDate)!.push({ item, mHour });
        }

        dailyMap.forEach((slots, dateStr) => {
          // Select representative daytime slot closest to 12:00 PM (noon)
          slots.sort((a, b) => Math.abs(a.mHour - 12) - Math.abs(b.mHour - 12));
          const repSlot = slots[0];
          const repItem = repSlot.item;

          const itemDate = new Date(repItem.dt * 1000);
          const dayName = itemDate.toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            weekday: 'short',
          });
          const itemWeather = repItem.weather?.[0] || {
            id: 800,
            main: 'Clear',
            description: 'Clear',
            icon: '01d',
          };
          forecastDaily.push({
            date: dateStr,
            dayName,
            tempC: Math.round(repItem.main.temp),
            feelsLikeC: Math.round(repItem.main.feels_like),
            humidity: repItem.main.humidity,
            windSpeedKmh: Math.round((repItem.wind?.speed ?? 0) * 3.6),
            rainMm: repItem.rain?.['3h'] ?? 0,
            condition: formatWeatherCondition(itemWeather.main, itemWeather.description),
            description: itemWeather.description,
            iconCode: itemWeather.icon,
            iconType: mapWeatherConditionToCategory(itemWeather.main, itemWeather.id),
          });
        });
      }
    }
  } catch {
    // Non-fatal: current weather remains valid even if forecast interval fails
  }

  const rainAmount = currentJson.rain
    ? (currentJson.rain['1h'] ?? currentJson.rain['3h'] ?? 0)
    : 0;

  const nowTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const parsedData: FlowJeepWeatherData = {
    temperatureC: Math.round(currentJson.main.temp),
    feelsLikeC: Math.round(currentJson.main.feels_like),
    humidity: currentJson.main.humidity,
    windSpeedKmh: Math.round(currentJson.wind.speed * 3.6), // m/s to km/h
    cloudCoveragePct: currentJson.clouds?.all ?? 0,
    rainMm: rainAmount,
    condition: conditionStr,
    description: primaryWeather.description,
    iconCode: primaryWeather.icon,
    iconUrl: `https://openweathermap.org/img/wn/${primaryWeather.icon}@2x.png`,
    iconType,
    locationName: currentJson.name || 'Current Location',
    country: currentJson.sys.country || '',
    dailyHighC,
    dailyLowC,
    precipitationProb,
    lastUpdated: `${nowTime} (OpenWeather)`,
    isLive: true,
    forecastDaily,
  };

  weatherCache.set(cacheKey, { data: parsedData, timestamp: Date.now() });
  return parsedData;
}

export interface UseOpenWeatherResult {
  weather: FlowJeepWeatherData | null;
  isLoading: boolean;
  error: 'LOCATION_UNAVAILABLE' | 'API_KEY_MISSING' | 'API_KEY_ACTIVATING' | 'WEATHER_UNAVAILABLE' | null;
  errorMessage: string | null;
  refetch: () => void;
}

/**
 * React Hook for consuming OpenWeather with caching, loading, and truthful error states
 */
export function useOpenWeather(
  coords: { lat: number; lng: number } | null
): UseOpenWeatherResult {
  const [weather, setWeather] = useState<FlowJeepWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(coords));
  const [error, setError] = useState<UseOpenWeatherResult['error']>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadWeather = useCallback(
    async (isManualRetry = false) => {
      if (!coords) {
        setIsLoading(false);
        setError('LOCATION_UNAVAILABLE');
        setErrorMessage('Location unavailable');
        setWeather(null);
        return;
      }

      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey || apiKey === 'your_openweather_api_key_here' || apiKey.trim() === '') {
        setIsLoading(false);
        setError('API_KEY_MISSING');
        setErrorMessage('OpenWeather API key not configured in .env');
        setWeather(null);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setErrorMessage(null);

      try {
        const data = await fetchOpenWeatherData(
          coords.lat,
          coords.lng,
          abortControllerRef.current.signal
        );
        setWeather(data);
        setError(null);
        setErrorMessage(null);
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        setWeather(null);
        if (err.message === 'API_KEY_MISSING') {
          setError('API_KEY_MISSING');
          setErrorMessage('OpenWeather API key not configured in .env');
        } else if (err.message === 'INVALID_API_KEY') {
          setError('API_KEY_ACTIVATING');
          setErrorMessage('OpenWeather API key is propagating (new keys take 10–30 mins to activate). Tap to retry.');
        } else {
          setError('WEATHER_UNAVAILABLE');
          setErrorMessage('Weather unavailable');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [coords?.lat, coords?.lng]
  );

  useEffect(() => {
    loadWeather();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadWeather]);

  return {
    weather,
    isLoading,
    error,
    errorMessage,
    refetch: () => loadWeather(true),
  };
}
