/**
 * FlowJeep Forecast Data Service & Hook
 *
 * Provides passenger occupancy forecast structure for the FlowJeep route.
 * Currently in development mode with empty telemetry / pending data state.
 * Preserves component schemas for future ML model integration.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  CorridorForecastData,
  DayOfWeek,
  DAYS_OF_WEEK,
  TimePeriodForecast,
  ForecastPlace,
  LiveWeatherData,
} from '../types/forecast';
import { DEFAULT_FORECAST_PLACE } from '../utils/forecastPlaces';
import { getCurrentWeekDays } from '../utils/dateUtils';

/**
 * Standard baseline time period definitions
 */
export const DEFAULT_PERIOD_SCHEMAS: Omit<
  TimePeriodForecast,
  'occupancyPercentage' | 'passengerCount' | 'totalCapacity' | 'status' | 'explanation'
>[] = [
  {
    id: 'period-1',
    name: 'Early Worker Dispatch',
    timeWindow: '5:30 AM – 6:30 AM',
  },
  {
    id: 'period-2',
    name: 'Morning Peak Rush',
    timeWindow: '6:30 AM – 9:00 AM',
  },
  {
    id: 'period-3',
    name: 'Midday Off-Peak',
    timeWindow: '10:00 AM – 2:30 PM',
  },
  {
    id: 'period-4',
    name: 'Afternoon School Surge',
    timeWindow: '3:00 PM – 5:00 PM',
  },
  {
    id: 'period-5',
    name: 'Evening Homeward Rush',
    timeWindow: '5:30 PM – 8:30 PM',
  },
  {
    id: 'period-6',
    name: 'Night Sweep',
    timeWindow: '8:30 PM – 11:00 PM',
  },
];

/**
 * Builds the forecast dataset for a specific place.
 * Returns empty / pending forecast values since the FlowJeep prediction system
 * is under active development and no real passenger load data has been collected yet.
 */
export function buildCorridorForecastData(
  place: ForecastPlace = DEFAULT_FORECAST_PLACE,
  liveWeather?: LiveWeatherData | null
): CorridorForecastData {
  const dailyForecasts: Record<DayOfWeek, any> = {} as any;
  const insights: Record<DayOfWeek, any> = {} as any;

  const currentWeekDays = getCurrentWeekDays();
  const weekDayMap = new Map(currentWeekDays.map((w) => [w.day, w]));

  DAYS_OF_WEEK.forEach((day) => {
    const weekInfo = weekDayMap.get(day);

    // 6 required dispatch time windows — structured but empty of mock percentages
    const periods: TimePeriodForecast[] = DEFAULT_PERIOD_SCHEMAS.map((schema) => ({
      id: `${day}-${schema.id}`,
      name: schema.name,
      timeWindow: schema.timeWindow,
      totalCapacity: 22,
      occupancyPercentage: undefined,
      passengerCount: undefined,
      status: undefined,
      explanation: undefined,
    }));

    dailyForecasts[day] = {
      day,
      dateString: weekInfo?.dateString || `${day}`,
      weatherCondition: liveWeather?.weatherCondition,
      temperatureC: liveWeather?.temperatureC,
      weatherIconType: liveWeather?.weatherIconType,
      weatherDemandNote: undefined,
      peakCrowdLevel: undefined,
      peakPercentage: undefined,
      recommendedWindow: undefined,
      corridorCondition: undefined,
      periods,
    };

    insights[day] = {};
  });

  // 7-day weekly forecast centered dynamically on the current week
  const weeklyForecast = currentWeekDays.map((info) => ({
    day: info.day,
    dateLabel: info.dateLabel,
    peakPercentage: undefined,
    status: undefined,
    isToday: info.isToday,
  }));

  return {
    corridorId: place.id,
    corridorName: place.name,
    lastUpdated: liveWeather?.lastUpdated,
    dailyForecasts,
    weeklyForecast,
    insights,
  };
}

export interface UseForecastReturn {
  data: CorridorForecastData;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Unified React hook that provides forecast data for any selected place and weather.
 * Returns empty-state data ready for future ML backend integration.
 */
export function useCorridorForecast(
  place: ForecastPlace = DEFAULT_FORECAST_PLACE,
  liveWeather?: LiveWeatherData | null
): UseForecastReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const forecastData = useMemo(() => {
    return buildCorridorForecastData(place, liveWeather);
  }, [place, liveWeather]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 200));
    } catch (err: any) {
      setError(err?.message || 'Error refreshing forecast');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data: forecastData,
    isLoading,
    error,
    refetch,
  };
}

