/**
 * FlowJeep Passenger Occupancy Forecast Type Definitions
 */

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type OccupancyStatus =
  | 'Seats Available'
  | 'Near-Full'
  | 'Full / Standing';

export interface ForecastPlace {
  id: string;
  name: string;
  shortName: string;
  corridor: string;
  category: 'Corridor' | 'Transit Hub' | 'Terminal' | 'Campus / School' | 'Commercial';
  description: string;
  coords: { lat: number; lng: number };
  morningDirection: string;
  eveningDirection: string;
  peakOccupancyProfile: Record<DayOfWeek, number>;
  isUserLocation?: boolean;
  distanceKm?: number;
  customLabel?: string;
}

export interface LiveWeatherData {
  temperatureC: number;
  apparentTempC: number;
  humidity: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherCondition: string;
  weatherIconType: 'sunny' | 'partly-cloudy' | 'rainy' | 'cloudy';
  precipitationProb: number;
  dailyHighC?: number;
  dailyLowC?: number;
  lastUpdated: string;
  locationName: string;
  demandImpactNote: string;
  isLive: boolean;
  isLoading: boolean;
  error?: string | null;
}

export interface TimePeriodForecast {
  id: string;
  name: string; // e.g. "Early Worker Dispatch", "Morning Peak Rush", etc.
  timeWindow: string; // e.g. "5:30 AM – 6:30 AM"
  occupancyPercentage?: number; // e.g. 95 (undefined in empty state)
  passengerCount?: number; // e.g. 20
  totalCapacity?: number; // e.g. 22
  status?: OccupancyStatus;
  explanation?: string;
}

export interface DailyForecast {
  day: DayOfWeek;
  dateString: string; // e.g. "Monday, September 15"
  weatherCondition?: string; // e.g. "Fair Skies Condition"
  temperatureC?: number; // e.g. 31
  weatherIconType?: 'sunny' | 'partly-cloudy' | 'rainy' | 'cloudy';
  weatherDemandNote?: string; // Short explanation of how condition relates to corridor demand
  peakCrowdLevel?: string; // e.g. "High Rush (95%)"
  peakPercentage?: number; // e.g. 95
  recommendedWindow?: string; // e.g. "10:00 AM – 2:30 PM"
  corridorCondition?: string; // e.g. "Normal corridor ridership with predictable demand"
  periods: TimePeriodForecast[];
}

export interface WeeklyDayForecast {
  day: DayOfWeek;
  dateLabel: string; // e.g. "Sep 15"
  peakPercentage?: number; // e.g. 95
  status?: 'Surge' | 'Busy' | 'Open';
  isToday?: boolean;
}

export interface ForecastInsights {
  highestOccupancyPeriod?: string;
  lowestOccupancyPeriod?: string;
  recommendedTravelWindow?: string;
  morningRushExpectation?: string;
  eveningRushExpectation?: string;
  schoolSurgeExpectation?: string;
  seatAvailabilityLikelihood?: string;
}

export interface CorridorForecastData {
  corridorId: string;
  corridorName: string;
  lastUpdated?: string;
  dailyForecasts: Record<DayOfWeek, DailyForecast>;
  weeklyForecast: WeeklyDayForecast[];
  insights: Record<DayOfWeek, ForecastInsights>;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Utility to determine occupancy status classification from percentage
 */
export function getOccupancyStatus(percentage?: number): OccupancyStatus {
  if (percentage === undefined || percentage === null) return 'Seats Available';
  if (percentage >= 90) return 'Full / Standing';
  if (percentage >= 80) return 'Near-Full';
  return 'Seats Available';
}

/**
 * Utility for weekly level classification
 */
export function getWeeklyStatus(percentage?: number): 'Surge' | 'Busy' | 'Open' {
  if (percentage === undefined || percentage === null) return 'Open';
  if (percentage >= 90) return 'Surge';
  if (percentage >= 80) return 'Busy';
  return 'Open';
}
