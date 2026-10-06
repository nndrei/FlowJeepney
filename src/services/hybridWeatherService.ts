/**
 * FlowJeep Hybrid Weather Service
 *
 * Implements the hybrid weather data source architecture:
 * 1. Past dates (before today in Asia/Manila)  -> Open-Meteo Historical Weather Archive
 * 2. Today (current date in Asia/Manila)        -> OpenWeather Current Weather
 * 3. Future dates (after today in Asia/Manila) -> OpenWeather 5-Day Forecast
 *
 * Performance & Stability Guarantees:
 * - Zero infinite re-render loops: Decoupled cache ref from callback dependency arrays.
 * - Request versioning: Older out-of-order network responses can never overwrite newer selections.
 * - Loading guarantee: Loading state is guaranteed to resolve without deadlock.
 * - Deduplication: Reuses cached 5-day forecast across date switches for the same location.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlowJeepWeatherData,
  WeatherIconCategory,
  fetchOpenWeatherData,
} from './openWeatherService';
import {
  FlowJeepHistoricalWeatherData,
  fetchOpenMeteoHistoricalWeather,
} from './openMeteoHistoricalService';
import { classifyDateInManila } from '../utils/weatherDateUtils';

export type WeatherSourceType = 'current' | 'forecast' | 'historical' | 'unavailable';

export interface FlowJeepResolvedDayWeather {
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  cloudCoveragePct?: number;
  rainMm?: number;
  condition: string;
  description: string;
  iconType: WeatherIconCategory;
  locationName: string;
  date: string; // YYYY-MM-DD
  sourceType: WeatherSourceType;
  sourceLabel: string;
  isHistorical: boolean;
  isToday: boolean;
  isForecast: boolean;
  isAvailable: boolean;
}

export interface UseHybridWeatherResult {
  weather: FlowJeepResolvedDayWeather | null;
  baseOpenWeatherData: FlowJeepWeatherData | null;
  isLoading: boolean;
  error: string | null;
  errorMessage: string | null;
  refetch: () => void;
  dateClassification: 'past' | 'today' | 'future';
}

/**
 * Resolves real weather for an arbitrary calendar date and coordinates.
 */
export async function resolveHybridDayWeather(
  lat: number,
  lng: number,
  isoDate: string,
  cachedOpenWeather?: FlowJeepWeatherData | null,
  signal?: AbortSignal
): Promise<FlowJeepResolvedDayWeather> {
  const classification = classifyDateInManila(isoDate);

  // 1. PAST DATES -> Open-Meteo Historical Weather Archive
  if (classification === 'past') {
    try {
      const histData: FlowJeepHistoricalWeatherData = await fetchOpenMeteoHistoricalWeather(
        lat,
        lng,
        isoDate,
        signal
      );

      return {
        temperatureC: histData.temperatureC,
        feelsLikeC: histData.feelsLikeC,
        humidity: histData.humidity,
        windSpeedKmh: histData.windSpeedKmh,
        cloudCoveragePct: histData.cloudCoveragePct,
        rainMm: histData.rainMm,
        condition: histData.condition,
        description: histData.description,
        iconType: histData.iconType,
        locationName: cachedOpenWeather?.locationName || 'Historical Observation',
        date: isoDate,
        sourceType: 'historical',
        sourceLabel: 'Actual Observation (Historical)',
        isHistorical: true,
        isToday: false,
        isForecast: false,
        isAvailable: true,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Historical data unavailable';
      throw new Error(`HISTORICAL_WEATHER_UNAVAILABLE: ${msg}`);
    }
  }

  // Fetch OpenWeather data (current + 5-day forecast) if not already provided
  const owData = cachedOpenWeather || (await fetchOpenWeatherData(lat, lng, signal));

  // 2. TODAY -> OpenWeather Current Observed Weather
  if (classification === 'today') {
    return {
      temperatureC: owData.temperatureC,
      feelsLikeC: owData.feelsLikeC,
      humidity: owData.humidity,
      windSpeedKmh: owData.windSpeedKmh,
      cloudCoveragePct: owData.cloudCoveragePct,
      rainMm: owData.rainMm,
      condition: owData.condition,
      description: owData.description,
      iconType: owData.iconType,
      locationName: owData.locationName,
      date: isoDate,
      sourceType: 'current',
      sourceLabel: 'Live Observed',
      isHistorical: false,
      isToday: true,
      isForecast: false,
      isAvailable: true,
    };
  }

  // 3. FUTURE DATES -> OpenWeather 5-Day Forecast
  const matchedForecast = owData.forecastDaily?.find((f) => f.date === isoDate);

  if (matchedForecast) {
    return {
      temperatureC: matchedForecast.tempC,
      feelsLikeC: matchedForecast.feelsLikeC,
      humidity: matchedForecast.humidity,
      windSpeedKmh: matchedForecast.windSpeedKmh,
      rainMm: matchedForecast.rainMm,
      condition: matchedForecast.condition,
      description: matchedForecast.description,
      iconType: matchedForecast.iconType,
      locationName: owData.locationName,
      date: isoDate,
      sourceType: 'forecast',
      sourceLabel: 'OpenWeather Forecast',
      isHistorical: false,
      isToday: false,
      isForecast: true,
      isAvailable: true,
    };
  }

  // Out of 5-day forecast horizon: Do NOT generate fake estimates
  throw new Error('FORECAST_UNAVAILABLE_FOR_DATE');
}

/**
 * Stable, Race-Condition-Free React Hook for FlowJeep Hybrid Weather
 */
export function useHybridWeather(
  coords: { lat: number; lng: number } | null,
  selectedIsoDate: string
): UseHybridWeatherResult {
  const [weather, setWeather] = useState<FlowJeepResolvedDayWeather | null>(null);
  const [baseOpenWeatherData, setBaseOpenWeatherData] = useState<FlowJeepWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stable references to prevent dependency cycles and race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);
  const baseOwCacheRef = useRef<{ key: string; data: FlowJeepWeatherData } | null>(null);

  // Coordinate primitive values for safe dependency tracking
  const lat = coords?.lat;
  const lng = coords?.lng;
  const coordKey =
    typeof lat === 'number' && typeof lng === 'number'
      ? `${lat.toFixed(4)},${lng.toFixed(4)}`
      : '';

  const classification = classifyDateInManila(selectedIsoDate);

  const loadWeather = useCallback(async () => {
    // Increment monotonic request ID to guard against stale out-of-order network responses
    const currentRequestId = ++latestRequestIdRef.current;

    if (!coordKey || typeof lat !== 'number' || typeof lng !== 'number') {
      setIsLoading(false);
      setError('LOCATION_UNAVAILABLE');
      setErrorMessage('Location coordinates unavailable');
      setWeather(null);
      return;
    }

    // Cancel previous inflight request if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setIsLoading(true);
    setError(null);
    setErrorMessage(null);

    try {
      // 1. Resolve base OpenWeather data (current + 5-day forecast)
      // Check in-memory ref cache for identical coordinates to avoid redundant network calls
      let currentOwData: FlowJeepWeatherData | null = null;
      if (baseOwCacheRef.current && baseOwCacheRef.current.key === coordKey) {
        currentOwData = baseOwCacheRef.current.data;
      }

      // If we don't have cached data for these coordinates, fetch from OpenWeather
      if (!currentOwData) {
        try {
          currentOwData = await fetchOpenWeatherData(lat, lng, ac.signal);
          if (currentRequestId === latestRequestIdRef.current) {
            baseOwCacheRef.current = { key: coordKey, data: currentOwData };
            setBaseOpenWeatherData(currentOwData);
          }
        } catch (owErr) {
          // If past date, OpenWeather failure is non-fatal since Open-Meteo handles past dates
          if (classification !== 'past') {
            throw owErr;
          }
        }
      }

      // 2. Resolve requested day's weather (Past -> Open-Meteo, Today/Future -> OpenWeather)
      const resolved = await resolveHybridDayWeather(
        lat,
        lng,
        selectedIsoDate,
        currentOwData,
        ac.signal
      );

      // Verify this response is still the latest requested selection
      if (currentRequestId === latestRequestIdRef.current) {
        setWeather(resolved);
        setError(null);
        setErrorMessage(null);
      }
    } catch (err: unknown) {
      // If obsolete request was aborted, ignore and let latest request complete
      if (currentRequestId !== latestRequestIdRef.current || ac.signal.aborted) {
        return;
      }

      const msg = err instanceof Error ? err.message : 'Unknown weather error';

      if (msg.includes('HISTORICAL_WEATHER_UNAVAILABLE')) {
        setError('HISTORICAL_UNAVAILABLE');
        setErrorMessage('Historical weather unavailable for this date');
      } else if (msg.includes('FORECAST_UNAVAILABLE_FOR_DATE')) {
        setError('FORECAST_OUT_OF_RANGE');
        setErrorMessage('Forecast unavailable for this future date');
      } else if (msg.includes('INVALID_API_KEY')) {
        setError('INVALID_API_KEY');
        setErrorMessage('Invalid OpenWeather API Key');
      } else {
        setError('FETCH_ERROR');
        setErrorMessage('Weather service currently unavailable');
      }
      setWeather(null);
    } finally {
      // Guaranteed termination of loading state for the latest active request
      if (currentRequestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [coordKey, lat, lng, selectedIsoDate, classification]);

  useEffect(() => {
    loadWeather();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadWeather]);

  return {
    weather,
    baseOpenWeatherData,
    isLoading,
    error,
    errorMessage,
    refetch: loadWeather,
    dateClassification: classification,
  };
}
