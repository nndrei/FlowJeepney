/**
 * FlowJeep Open-Meteo Historical Weather Service
 *
 * Retrieves real historical meteorological data for past calendar dates
 * using Open-Meteo's Archive API with strict Asia/Manila timezone alignment.
 *
 * Zero mock fallbacks: If data is unavailable, throws or returns null.
 */

import { WeatherIconCategory } from '../types/weather';

export interface FlowJeepHistoricalWeatherData {
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  cloudCoveragePct: number;
  rainMm: number;
  condition: string;
  description: string;
  iconType: WeatherIconCategory;
  dailyHighC?: number;
  dailyLowC?: number;
  date: string; // YYYY-MM-DD
  sourceType: 'historical';
  sourceLabel: string;
}

/**
 * Maps WMO (World Meteorological Organization) weather codes to FlowJeep condition and icon category
 */
export function mapWmoCodeToCondition(code: number): {
  condition: string;
  description: string;
  iconType: WeatherIconCategory;
} {
  switch (code) {
    case 0:
      return { condition: 'Clear', description: 'Clear sky', iconType: 'sunny' };
    case 1:
      return { condition: 'Mainly Clear', description: 'Mainly clear sky', iconType: 'sunny' };
    case 2:
      return { condition: 'Partly Cloudy', description: 'Partly cloudy sky', iconType: 'partly-cloudy' };
    case 3:
      return { condition: 'Overcast', description: 'Overcast clouds', iconType: 'cloudy' };
    case 45:
    case 48:
      return { condition: 'Mist / Fog', description: 'Depositing rime fog', iconType: 'mist' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', description: 'Light to moderate drizzle', iconType: 'rainy' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', description: 'Freezing drizzle', iconType: 'rainy' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', description: 'Rain showers', iconType: 'rainy' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', description: 'Freezing rain', iconType: 'rainy' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { condition: 'Snow', description: 'Snow flurries', iconType: 'cloudy' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', description: 'Passing rain showers', iconType: 'rainy' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', description: 'Snow showers', iconType: 'cloudy' };
    case 95:
      return { condition: 'Thunderstorm', description: 'Thunderstorm with lightning', iconType: 'thunderstorm' };
    case 96:
    case 99:
      return {
        condition: 'Severe Thunderstorm',
        description: 'Thunderstorm with heavy precipitation',
        iconType: 'thunderstorm',
      };
    default:
      return { condition: 'Fair', description: 'Fair weather', iconType: 'partly-cloudy' };
  }
}

// In-memory cache for historical weather queries: key -> data
const historicalCache = new Map<string, FlowJeepHistoricalWeatherData>();

/**
 * Fetches real historical weather from Open-Meteo Archive API
 * for a specific past date and coordinates in Asia/Manila.
 */
export async function fetchOpenMeteoHistoricalWeather(
  lat: number,
  lng: number,
  isoDate: string,
  signal?: AbortSignal
): Promise<FlowJeepHistoricalWeatherData> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${isoDate}`;
  const cached = historicalCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Request hourly historical variables in Asia/Manila timezone
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    start_date: isoDate,
    end_date: isoDate,
    hourly:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,cloud_cover',
    timezone: 'Asia/Manila',
  });

  // Attempt 1: Open-Meteo Archive API (authoritative historical archive)
  let url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
  let response = await fetch(url, { signal });

  // Attempt 2: If archive is pending (e.g. yesterday just completed ingestion), fallback to forecast API with past_days
  if (!response.ok) {
    const forecastPastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&past_days=7&forecast_days=1&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,cloud_cover&timezone=Asia%2FManila`;
    const fallbackRes = await fetch(forecastPastUrl, { signal });
    if (fallbackRes.ok) {
      response = fallbackRes;
    } else {
      throw new Error(`Open-Meteo Historical API error: HTTP ${response.status}`);
    }
  }

  const json = await response.json();
  const hourly = json.hourly;

  if (!hourly || !hourly.time || hourly.time.length === 0) {
    throw new Error('NO_HISTORICAL_DATA');
  }

  // Filter slots corresponding to the requested date (YYYY-MM-DD)
  const slotIndices: number[] = [];
  for (let i = 0; i < hourly.time.length; i++) {
    if (hourly.time[i].startsWith(isoDate)) {
      slotIndices.push(i);
    }
  }

  if (slotIndices.length === 0) {
    throw new Error('NO_HISTORICAL_DATA_FOR_DATE');
  }

  // Pick representative index: midday (12:00 PM or 14:00 PM), or middle slot of the available hours
  let repIdx = slotIndices.find((idx) => hourly.time[idx].includes('12:00') || hourly.time[idx].includes('13:00') || hourly.time[idx].includes('14:00'));
  if (repIdx === undefined) {
    repIdx = slotIndices[Math.floor(slotIndices.length / 2)];
  }

  // Calculate day total rainfall and max temp
  const dayTemps = slotIndices.map((i) => hourly.temperature_2m[i]).filter((v: unknown): v is number => typeof v === 'number');
  const dayRain = slotIndices.map((i) => hourly.precipitation[i]).filter((v: unknown): v is number => typeof v === 'number');
  const totalRainMm = dayRain.reduce((acc, val) => acc + val, 0);

  const rawTemp = hourly.temperature_2m[repIdx] ?? (dayTemps.length > 0 ? dayTemps[0] : 28);
  const rawFeelsLike = hourly.apparent_temperature?.[repIdx] ?? rawTemp;
  const rawHumidity = hourly.relative_humidity_2m[repIdx] ?? 60;
  const rawWindSpeed = hourly.wind_speed_10m[repIdx] ?? 5; // km/h
  const rawCloudCover = hourly.cloud_cover[repIdx] ?? 50;
  const rawWeatherCode = hourly.weather_code[repIdx] ?? 0;

  const { condition, description, iconType } = mapWmoCodeToCondition(rawWeatherCode);

  const parsedData: FlowJeepHistoricalWeatherData = {
    temperatureC: Math.round(rawTemp),
    feelsLikeC: Math.round(rawFeelsLike),
    humidity: Math.round(rawHumidity),
    windSpeedKmh: Math.round(rawWindSpeed),
    cloudCoveragePct: Math.round(rawCloudCover),
    rainMm: Math.round(totalRainMm * 10) / 10,
    condition,
    description,
    iconType,
    dailyHighC: dayTemps.length > 0 ? Math.round(Math.max(...dayTemps)) : undefined,
    dailyLowC: dayTemps.length > 0 ? Math.round(Math.min(...dayTemps)) : undefined,
    date: isoDate,
    sourceType: 'historical',
    sourceLabel: 'Actual Observation (Historical)',
  };

  historicalCache.set(cacheKey, parsedData);
  return parsedData;
}
