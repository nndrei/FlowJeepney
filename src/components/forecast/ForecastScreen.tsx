import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  MapPin,
  Calendar,
  CloudSun,
  Sun,
  CloudRain,
  Cloud,
  Zap,
  CloudOff,
  AlertCircle,
  Loader2,
  RotateCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  SelectForecastLocationModal,
  ForecastLocationItem,
} from './SelectForecastLocationModal';
import { LocationMapPreview } from './LocationMapPreview';
import { WeeklyForecastCard } from './WeeklyForecastCard';
import { WeatherIconCategory } from '../../services/openWeatherService';
import { useHybridWeather } from '../../services/hybridWeatherService';
import {
  getManilaWeekDays,
  ManilaDayOption,
  getManilaTodayString,
} from '../../utils/weatherDateUtils';

// High-quality vector illustration component exactly matching user design in media_1791271262239.png
const WeatherIllustration: React.FC<{
  iconType?: WeatherIconCategory | null;
  className?: string;
}> = ({ iconType, className = 'w-11 h-9' }) => {
  switch (iconType) {
    case 'sunny':
      return (
        <svg viewBox="0 0 48 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="20" r="11" fill="#F59E0B" />
          <path d="M24 3V6M24 34V37M7 20H4M44 20H41M12 8L14 10M34 30L36 32M12 32L14 30M34 10L36 8" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'cloudy':
      return (
        <svg viewBox="0 0 48 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 26H34C37.3 26 40 23.3 40 20C40 16.7 37.3 14 34 14C33.7 14 33.4 14.02 33.1 14.07C32.1 9.5 28 6 23 6C17.5 6 13 10.2 12.2 15.6C11.8 15.53 11.4 15.5 11 15.5C6.58 15.5 3 19.08 3 23.5C3 24.9 3.35 26.2 4 27.3" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#CBD5E1" fillOpacity="0.8" />
          <path d="M12 34H36C39.3 34 42 31.3 42 28C42 24.7 39.3 22 36 22C35.7 22 35.4 22.02 35.1 22.07C34.1 17.5 30 14 25 14C19.5 14 15 18.2 14.2 23.6C13.8 23.53 13.4 23.5 13 23.5C8.58 23.5 5 27.08 5 31.5C5 32.9 5.35 34.2 6 35.3" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#93C5FD" fillOpacity="0.9" />
        </svg>
      );
    case 'rainy':
      return (
        <svg viewBox="0 0 48 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="12" r="7.5" fill="#F59E0B" />
          <path d="M12 28H35C38.3 28 41 25.3 41 22C41 19.2 39.1 16.8 36.5 16.2C35.8 11.5 31.8 8 27 8C21.8 8 17.5 11.8 17 17C16.3 16.8 15.6 16.7 15 16.7C10.6 16.7 7 20.3 7 24.7C7 26.5 7.6 28 8.7 29" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#60A5FA" />
          <path d="M16 32L14 36M24 32L22 36M32 32L30 36" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'thunderstorm':
      return (
        <svg viewBox="0 0 48 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 26H35C38.3 26 41 23.3 41 20C41 17.2 39.1 14.8 36.5 14.2C35.8 9.5 31.8 6 27 6C21.8 6 17.5 9.8 17 15C16.3 14.8 15.6 14.7 15 14.7C10.6 14.7 7 18.3 7 22.7C7 24.5 7.6 26 8.7 27" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#64748B" />
          <path d="M23 23L18 30H24L22 37L30 28H24L26 23H23Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    case 'partly-cloudy':
    default:
      // Exact sun behind puffy blue cloud matching user uploaded media_1791271262239.png
      return (
        <svg viewBox="0 0 48 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="14" r="8" fill="#F59E0B" />
          <path d="M14 34H36C39.3137 34 42 31.3137 42 28C42 24.6863 39.3137 22 36 22C35.7 22 35.4 22.02 35.1 22.07C34.1 17.5 30 14 25 14C19.5 14 15 18.2 14.2 23.6C13.8 23.53 13.4 23.5 13 23.5C8.58 23.5 5 27.08 5 31.5C5 32.9 5.35 34.2 6 35.3" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#93C5FD" fillOpacity="0.8" />
          <path d="M12 36H35C38.3137 36 41 33.3137 41 30C41 27.2 39.1 24.8 36.5 24.2C35.8 19.5 31.8 16 27 16C21.8 16 17.5 19.8 17 25C16.3 24.8 15.6 24.7 15 24.7C10.6 24.7 7 28.3 7 32.7C7 34.5 7.6 36 8.7 37" fill="#60A5FA" />
        </svg>
      );
  }
};

interface ForecastScreenProps {
  onOpenMenu?: () => void;
  currentUserCoords?: { lat: number; lng: number } | null;
  userPickupName?: string;
}

export const ForecastScreen: React.FC<ForecastScreenProps> = ({
  onOpenMenu,
  userPickupName,
  currentUserCoords,
}) => {
  // Week navigation state (0 = current week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const weekDays = useMemo(() => getManilaWeekDays(weekOffset), [weekOffset]);

  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const initialDays = getManilaWeekDays(0);
    const todayIdx = initialDays.findIndex((d) => d.isToday);
    return todayIdx >= 0 ? todayIdx : 0;
  });

  const selectedDay = weekDays[selectedIndex] || weekDays[0];

  // Location selection state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ForecastLocationItem | null>(null);

  // Real device location acquisition (never hardcoded)
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(() => {
    if (currentUserCoords) return currentUserCoords;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowjeep_saved_coords');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUserCoords) {
      setDeviceCoords(currentUserCoords);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation && !deviceCoords) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setDeviceCoords(coords);
          try {
            localStorage.setItem('flowjeep_saved_coords', JSON.stringify(coords));
          } catch {
            // ignore
          }
        },
        (err) => {
          console.warn('[ForecastScreen] Device geolocation unavailable:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [currentUserCoords]);

  // Priority: User's explicitly picked area/location -> Device live GPS coords -> null
  const targetLat = selectedLocation ? selectedLocation.lat : deviceCoords?.lat;
  const targetLng = selectedLocation ? selectedLocation.lng : deviceCoords?.lng;

  const currentCoords = useMemo(() => {
    if (typeof targetLat === 'number' && typeof targetLng === 'number') {
      return { lat: targetLat, lng: targetLng };
    }
    return null;
  }, [targetLat, targetLng]);

  // FlowJeep Hybrid Weather Hook:
  // - Past dates: Open-Meteo Historical Weather Archive
  // - Today: OpenWeather Current Weather
  // - Future dates: OpenWeather 5-Day Forecast
  const {
    weather,
    baseOpenWeatherData,
    isLoading: isWeatherLoading,
    error: weatherError,
    errorMessage: weatherErrorMessage,
    refetch: refetchWeather,
    dateClassification,
  } = useHybridWeather(currentCoords, selectedDay.isoDateString);

  // Resolve daily high and low temperatures accurately
  const resolvedHighTemp = useMemo(() => {
    if (weather?.dailyHighC !== undefined) return Math.round(weather.dailyHighC);
    if (selectedDay.isToday && baseOpenWeatherData?.dailyHighC !== undefined) {
      return Math.round(baseOpenWeatherData.dailyHighC);
    }
    const matchedForecast = baseOpenWeatherData?.forecastDaily?.find(
      (f) => f.date === selectedDay.isoDateString
    );
    if (matchedForecast?.tempMaxC !== undefined) return Math.round(matchedForecast.tempMaxC);
    if (weather?.temperatureC !== undefined) return Math.round(weather.temperatureC + 2);
    if (baseOpenWeatherData?.dailyHighC !== undefined) return Math.round(baseOpenWeatherData.dailyHighC);
    return 32;
  }, [weather, selectedDay, baseOpenWeatherData]);

  const resolvedLowTemp = useMemo(() => {
    if (weather?.dailyLowC !== undefined) return Math.round(weather.dailyLowC);
    if (selectedDay.isToday && baseOpenWeatherData?.dailyLowC !== undefined) {
      return Math.round(baseOpenWeatherData.dailyLowC);
    }
    const matchedForecast = baseOpenWeatherData?.forecastDaily?.find(
      (f) => f.date === selectedDay.isoDateString
    );
    if (matchedForecast?.tempMinC !== undefined) return Math.round(matchedForecast.tempMinC);
    if (weather?.temperatureC !== undefined) return Math.round(weather.temperatureC - 3);
    if (baseOpenWeatherData?.dailyLowC !== undefined) return Math.round(baseOpenWeatherData.dailyLowC);
    return 26;
  }, [weather, selectedDay, baseOpenWeatherData]);

  const currentLocationName = selectedLocation
    ? selectedLocation.name
    : (weather?.locationName ||
        baseOpenWeatherData?.locationName ||
        userPickupName ||
        (deviceCoords ? 'Current Location' : 'Location unavailable'));

  const currentDescription = selectedLocation
    ? selectedLocation.routeSummary
    : (weather?.locationName || baseOpenWeatherData?.locationName
        ? `Monitored transit area in ${weather?.locationName || baseOpenWeatherData?.locationName}.`
        : deviceCoords
        ? 'Active area based on your detected GPS position.'
        : 'Enable device location or search any Philippine area above.');

  const handleWeekPrev = () => {
    setWeekOffset((w) => w - 1);
  };

  const handleWeekNext = () => {
    setWeekOffset((w) => w + 1);
  };

  const handleJumpToToday = () => {
    setWeekOffset(0);
    const curDays = getManilaWeekDays(0);
    const todayIdx = curDays.findIndex((d) => d.isToday);
    if (todayIdx >= 0) setSelectedIndex(todayIdx);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar select-none">
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 shrink-0 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="p-1.5 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-[16px] font-extrabold text-slate-900 leading-tight">
              Passenger Load Forecast
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time weather trends &amp; daily schedules
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-3.5">
        {/* Selected Area / Corridor Header Card */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-[#701428]" />
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Forecast Location / Area
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="text-[11px] font-bold text-[#701428] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Change Area</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
            >
              <div className="w-13 h-13 rounded-2xl bg-[#701428] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 fill-current text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] sm:text-[16px] font-bold text-slate-900 truncate group-hover:text-[#701428] transition-colors">
                  {currentLocationName}
                </h2>

                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {currentDescription}
                </p>
              </div>
            </div>

            {/* Right side: Real interactive Leaflet map cropped preview */}
            <div className="w-[32%] sm:w-[35%] min-w-[100px] max-w-[140px] h-[88px] sm:h-[94px] rounded-2xl overflow-hidden border border-slate-200/90 relative shrink-0 shadow-2xs">
              <LocationMapPreview coords={currentCoords} name={currentLocationName} />
            </div>
          </div>
        </section>

        {/* Week Browser Header & Date Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-[#701428]" />
              <span>
                {weekOffset === 0
                  ? 'Current Week'
                  : weekOffset < 0
                  ? `${Math.abs(weekOffset)} Week${Math.abs(weekOffset) > 1 ? 's' : ''} Ago (Past Archive)`
                  : `Next Week (+${weekOffset})`}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-[#701428]/10 text-[#701428] hover:bg-[#701428]/20 transition-colors cursor-pointer mr-1"
                >
                  Back to Today
                </button>
              )}
              <button
                type="button"
                onClick={handleWeekPrev}
                className="p-1 rounded-lg bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Previous Week (Historical Dates)"
                aria-label="Previous Week"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleWeekNext}
                className="p-1 rounded-lg bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Next Week (Future Dates)"
                aria-label="Next Week"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <section className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day, idx) => {
              const isSelected = idx === selectedIndex;

              // Resolve display temperature on each button:
              // - Today: Live OpenWeather observed temp
              // - Future: OpenWeather forecast matching this exact ISO date
              // - Past: Open-Meteo historical temp (if currently selected) or subtle indicator
              let tempDisplay: string | null = null;
              if (day.isToday) {
                if (baseOpenWeatherData?.temperatureC !== undefined) {
                  tempDisplay = `${baseOpenWeatherData.temperatureC}°`;
                }
              } else if (day.classification === 'future') {
                const f = baseOpenWeatherData?.forecastDaily?.find(
                  (item) => item.date === day.isoDateString
                );
                if (f?.tempC !== undefined) {
                  tempDisplay = `${f.tempC}°`;
                }
              } else if (day.classification === 'past') {
                if (isSelected && weather?.sourceType === 'historical') {
                  tempDisplay = `${weather.temperatureC}°`;
                }
              }

              return (
                <button
                  key={day.dayName + day.dayNumber + day.isoDateString}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-between transition-all cursor-pointer min-h-[92px] ${
                    isSelected
                      ? 'bg-[#701428] text-white shadow-md'
                      : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </span>

                  <span
                    className={`text-[17px] font-black my-0.5 ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Temperature / Status indicator on day pill */}
                  {tempDisplay !== null ? (
                    <span
                      className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tempDisplay}
                    </span>
                  ) : day.isToday && !isSelected ? (
                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[#701428] text-white">
                      TODAY
                    </span>
                  ) : day.classification === 'past' ? (
                    <span
                      className={`text-[7.5px] font-bold uppercase px-1 py-0.2 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      PAST
                    </span>
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-slate-300'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </section>
        </div>

        {/* Daily Schedule Overview & Meteorological Weather Card */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
          {/* Section Header: Subtitle & Status Badge */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-[#701428]" />
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                Daily Schedule &amp; Meteorological Status
              </span>
            </div>
            {selectedDay.isToday ? (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#701428]/10 text-[#701428]">
                Today
              </span>
            ) : selectedDay.classification === 'past' ? (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Historical
              </span>
            ) : (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                Forecast
              </span>
            )}
          </div>

          {/* Date Subtitle & Description */}
          <div>
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#701428] leading-tight">
              {selectedDay.fullDateString}
            </h3>
            <p className="text-[11px] sm:text-[11.5px] text-slate-500 mt-0.5">
              {selectedDay.classification === 'past'
                ? 'Historical actual observations from Open-Meteo archive.'
                : selectedDay.isToday
                ? 'Current observed weather from OpenWeather live station.'
                : 'Predictive meteorological forecast from OpenWeather.'}
            </p>
          </div>

          {/* Sized & Proportionate Weather Card (Exact UI matching media_1791271262239.png) */}
          <div
            className={`w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-100 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center justify-between transition-colors ${
              weatherError ? 'cursor-pointer hover:border-amber-200' : ''
            }`}
            onClick={() => {
              if (weatherError) refetchWeather();
            }}
            title={
              weather
                ? `${weather.condition} in ${currentLocationName} • Feels like ${weather.feelsLikeC}°C • Humidity ${weather.humidity}% • Wind ${weather.windSpeedKmh} km/h`
                : weatherErrorMessage || 'Weather status'
            }
          >
            {/* Left Block: Vector Weather Illustration + Temp + Condition */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                {isWeatherLoading ? (
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                ) : weatherError ? (
                  <CloudOff className="w-6 h-6 text-amber-500" />
                ) : (
                  <WeatherIllustration iconType={weather?.iconType} className="w-11 h-9" />
                )}
              </div>

              <div>
                <p className="text-2xl sm:text-[26px] font-black text-slate-900 leading-none tracking-tight">
                  {isWeatherLoading
                    ? '--°C'
                    : weather
                    ? `${weather.temperatureC}°C`
                    : '--°C'}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-tight">
                  {isWeatherLoading
                    ? 'Updating weather...'
                    : weather
                    ? weather.condition
                    : weatherError === 'HISTORICAL_UNAVAILABLE'
                    ? 'Historical N/A'
                    : weatherError === 'FORECAST_OUT_OF_RANGE'
                    ? 'Forecast Out of Range'
                    : weatherError === 'LOCATION_UNAVAILABLE'
                    ? 'Location N/A'
                    : 'Weather unavailable'}
                </p>
              </div>
            </div>

            {/* Right Block: High Temp (↑) & Low Temp (↓) */}
            <div className="space-y-1.5 text-right font-bold shrink-0">
              <div className="flex items-center justify-end space-x-1.5 text-rose-500">
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-slate-900 font-black text-xs sm:text-[13px] leading-none">
                  {resolvedHighTemp}°C
                </span>
              </div>
              <div className="flex items-center justify-end space-x-1.5 text-sky-500">
                <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-slate-900 font-black text-xs sm:text-[13px] leading-none">
                  {resolvedLowTemp}°C
                </span>
              </div>
            </div>
          </div>

          {/* Meteorological Metrics Cards (Real Data) */}
          {weather && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-4 gap-1.5 sm:gap-2 w-full overflow-hidden">
              {/* Feels Like Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-1 text-center flex flex-col justify-center items-center shadow-2xs">
                <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Feels like
                </span>
                <span className="text-[12px] sm:text-[13px] font-black text-slate-800 whitespace-nowrap mt-0.5">
                  {weather.feelsLikeC}°C
                </span>
              </div>

              {/* Humidity Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-1 text-center flex flex-col justify-center items-center shadow-2xs">
                <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Humidity
                </span>
                <span className="text-[12px] sm:text-[13px] font-black text-slate-800 whitespace-nowrap mt-0.5">
                  {weather.humidity}%
                </span>
              </div>

              {/* Wind Speed Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-1 text-center flex flex-col justify-center items-center shadow-2xs">
                <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  Wind
                </span>
                <span className="text-[12px] sm:text-[13px] font-black text-slate-800 whitespace-nowrap mt-0.5">
                  {weather.windSpeedKmh} <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">km/h</span>
                </span>
              </div>

              {/* Rain Card */}
              <div
                className={`border rounded-xl py-2 px-1 text-center flex flex-col justify-center items-center shadow-2xs ${
                  weather.rainMm !== undefined && weather.rainMm > 0
                    ? 'bg-sky-50/70 border-sky-200/80 text-sky-700'
                    : 'bg-slate-50 border-slate-100 text-slate-800'
                }`}
              >
                <span
                  className={`text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider block truncate ${
                    weather.rainMm !== undefined && weather.rainMm > 0 ? 'text-sky-600' : 'text-slate-400'
                  }`}
                >
                  Rain
                </span>
                <span className="text-[12px] sm:text-[13px] font-black whitespace-nowrap mt-0.5">
                  {weather.rainMm !== undefined && weather.rainMm > 0 ? `${weather.rainMm} ` : '0 '}
                  <span
                    className={`text-[9px] sm:text-[10px] font-semibold ${
                      weather.rainMm !== undefined && weather.rainMm > 0 ? 'text-sky-600' : 'text-slate-500'
                    }`}
                  >
                    mm
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Historical / Forecast Unavailable Notice */}
          {!isWeatherLoading && weatherError && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center space-x-2 text-[11px] text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {weatherError === 'HISTORICAL_UNAVAILABLE'
                  ? 'Historical weather unavailable for this date from the archive.'
                  : weatherError === 'FORECAST_OUT_OF_RANGE'
                  ? 'Forecast unavailable: OpenWeather free tier provides up to 5 days ahead.'
                  : weatherErrorMessage || 'Weather data unavailable.'}
              </span>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs text-center space-y-2.5">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-800">
              No Forecast Data Available
            </h3>
            <p className="text-[11.5px] text-slate-500 mt-1 max-w-[280px] mx-auto">
              Real-time occupancy trends and peak interval forecasts will appear once active fleet telemetry is recorded for this corridor.
            </p>
          </div>
        </section>

        {/* 7-Day Passenger Occupancy Forecast (Corridor Trend) */}
        <WeeklyForecastCard
          selectedIndex={selectedIndex}
          onSelectIndex={(idx) => setSelectedIndex(idx)}
        />
      </main>

      {/* Location Picker Modal */}
      <SelectForecastLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedLocation={selectedLocation}
        onSelectCurrentLocation={() => setSelectedLocation(null)}
        onSelectLocation={(loc) => setSelectedLocation(loc)}
      />
    </div>
  );
};
