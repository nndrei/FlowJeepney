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

const getWeatherPillTheme = (
  iconType?: WeatherIconCategory | null,
  isError?: boolean,
  isLoading?: boolean
) => {
  if (isError) {
    return {
      container:
        'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 border border-rose-500/50 text-white shadow-md shadow-rose-950/40 hover:brightness-110',
      icon: 'text-rose-300',
      temp: 'text-white',
      condition: 'text-rose-200 font-semibold',
      badge: 'bg-rose-900/80 text-rose-200 border-rose-500/40',
      retryIcon: 'text-rose-300 hover:text-white',
    };
  }

  if (isLoading || !iconType) {
    return {
      container: 'bg-slate-900 border border-slate-800 text-white shadow-sm',
      icon: 'text-slate-400',
      temp: 'text-white',
      condition: 'text-slate-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      retryIcon: 'text-slate-400 hover:text-white',
    };
  }

  switch (iconType) {
    case 'rainy':
      return {
        container:
          'bg-gradient-to-r from-sky-950 via-blue-900 to-indigo-950 border border-sky-400/50 text-white shadow-md shadow-sky-950/50 hover:brightness-110',
        icon: 'text-sky-300',
        temp: 'text-white',
        condition: 'text-sky-200 font-semibold',
        badge: 'bg-sky-500/30 text-sky-100 border-sky-400/50',
        retryIcon: 'text-sky-300 hover:text-white',
      };
    case 'thunderstorm':
      return {
        container:
          'bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border border-amber-400/60 text-white shadow-md shadow-purple-950/50 hover:brightness-110',
        icon: 'text-amber-400',
        temp: 'text-white',
        condition: 'text-amber-200 font-semibold',
        badge: 'bg-amber-500/30 text-amber-100 border-amber-400/50',
        retryIcon: 'text-amber-300 hover:text-white',
      };
    case 'sunny':
      return {
        container:
          'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 border border-amber-200/60 text-white shadow-md shadow-orange-950/30 hover:brightness-110',
        icon: 'text-amber-100',
        temp: 'text-white',
        condition: 'text-amber-50 font-bold',
        badge: 'bg-black/25 text-white border-white/40',
        retryIcon: 'text-amber-100 hover:text-white',
      };
    case 'partly-cloudy':
      return {
        container:
          'bg-gradient-to-r from-blue-900 via-slate-800 to-sky-950 border border-sky-400/40 text-white shadow-md shadow-blue-950/40 hover:brightness-110',
        icon: 'text-amber-300',
        temp: 'text-white',
        condition: 'text-cyan-100 font-semibold',
        badge: 'bg-sky-500/25 text-sky-200 border-sky-400/40',
        retryIcon: 'text-cyan-200 hover:text-white',
      };
    case 'cloudy':
      return {
        container:
          'bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 border border-slate-400/50 text-white shadow-md shadow-slate-900/40 hover:brightness-110',
        icon: 'text-slate-200',
        temp: 'text-white',
        condition: 'text-slate-200 font-semibold',
        badge: 'bg-white/20 text-slate-100 border-slate-300/40',
        retryIcon: 'text-slate-300 hover:text-white',
      };
    case 'mist':
      return {
        container:
          'bg-gradient-to-r from-teal-950 via-slate-800 to-emerald-950 border border-teal-400/40 text-white shadow-md shadow-teal-950/40 hover:brightness-110',
        icon: 'text-teal-300',
        temp: 'text-white',
        condition: 'text-teal-200 font-semibold',
        badge: 'bg-teal-500/30 text-teal-100 border-teal-400/40',
        retryIcon: 'text-teal-300 hover:text-white',
      };
    default:
      return {
        container: 'bg-slate-900 border border-slate-800 text-white shadow-sm',
        icon: 'text-amber-300',
        temp: 'text-white',
        condition: 'text-slate-400 font-medium',
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        retryIcon: 'text-slate-400 hover:text-white',
      };
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

  const pillTheme = getWeatherPillTheme(
    weather?.iconType,
    Boolean(weatherError),
    isWeatherLoading
  );

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

        {/* Daily Schedule Overview & Meteorological Weather Pill */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Calendar className="w-4 h-4 text-[#701428]" />
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Daily Schedule &amp; Meteorological Status
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-[18px] font-bold text-[#701428] leading-tight">
                  {selectedDay.fullDateString}
                </h3>
                {selectedDay.isToday && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#701428]/10 text-[#701428]">
                    Today
                  </span>
                )}
                {selectedDay.classification === 'past' && !selectedDay.isToday && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Past
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                {selectedDay.classification === 'past'
                  ? 'Historical actual observations from Open-Meteo'
                  : selectedDay.isToday
                  ? 'Current observed weather from OpenWeather'
                  : 'Predictive meteorological forecast from OpenWeather'}
              </p>
            </div>

            {/* Dynamic Weather Pill */}
            <div
              className={`rounded-2xl p-3 flex items-center space-x-2.5 shrink-0 transition-all duration-300 ${pillTheme.container} ${
                weatherError ? 'cursor-pointer' : ''
              }`}
              onClick={() => {
                if (weatherError) {
                  refetchWeather();
                }
              }}
              title={
                weather
                  ? `${weather.condition} in ${currentLocationName} • Feels like ${weather.feelsLikeC}°C • Humidity ${weather.humidity}% • Wind ${weather.windSpeedKmh} km/h (${weather.sourceLabel})`
                  : weatherErrorMessage || 'Weather status'
              }
            >
              {(() => {
                if (isWeatherLoading) {
                  return <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />;
                }
                if (weatherError === 'LOCATION_UNAVAILABLE') {
                  return <MapPin className={`w-5 h-5 ${pillTheme.icon}`} />;
                }
                if (weatherError) {
                  return <CloudOff className={`w-5 h-5 ${pillTheme.icon}`} />;
                }
                if (!weather) {
                  return <CloudSun className={`w-5 h-5 ${pillTheme.icon}`} />;
                }
                switch (weather.iconType) {
                  case 'sunny':
                    return <Sun className={`w-5 h-5 ${pillTheme.icon}`} />;
                  case 'partly-cloudy':
                    return <CloudSun className={`w-5 h-5 ${pillTheme.icon}`} />;
                  case 'cloudy':
                    return <Cloud className={`w-5 h-5 ${pillTheme.icon}`} />;
                  case 'rainy':
                    return <CloudRain className={`w-5 h-5 ${pillTheme.icon}`} />;
                  case 'thunderstorm':
                    return <Zap className={`w-5 h-5 ${pillTheme.icon}`} />;
                  default:
                    return <CloudSun className={`w-5 h-5 ${pillTheme.icon}`} />;
                }
              })()}

              <div className="text-right">
                <div className="flex items-center justify-end space-x-1.5">
                  <span className={`text-[14px] font-black block leading-none ${pillTheme.temp}`}>
                    {isWeatherLoading
                      ? '--°C'
                      : weather
                      ? `${weather.temperatureC}°C`
                      : '--°C'}
                  </span>

                  {/* Clean source indicator badge */}
                  {weather?.sourceType === 'historical' ? (
                    <span className="text-[8px] font-extrabold uppercase tracking-wider px-1 py-0.2 rounded border bg-emerald-500/30 text-emerald-100 border-emerald-400/50">
                      Actual
                    </span>
                  ) : weather?.sourceType === 'current' ? (
                    <span className="text-[8px] font-extrabold uppercase tracking-wider px-1 py-0.2 rounded border bg-white/20 text-white border-white/40">
                      Live
                    </span>
                  ) : weather?.sourceType === 'forecast' ? (
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1 py-0.2 rounded border ${pillTheme.badge}`}>
                      Fcst
                    </span>
                  ) : weatherError === 'HISTORICAL_UNAVAILABLE' ? (
                    <span className="text-[8px] font-extrabold uppercase tracking-wider px-1 py-0.2 rounded border bg-slate-800 text-slate-300 border-slate-700">
                      Past
                    </span>
                  ) : null}
                </div>

                <span className={`text-[10px] mt-0.5 block max-w-[115px] truncate ${pillTheme.condition}`}>
                  {isWeatherLoading
                    ? 'Updating...'
                    : weather
                    ? weather.condition
                    : weatherError === 'HISTORICAL_UNAVAILABLE'
                    ? 'Hist. Unavailable'
                    : weatherError === 'FORECAST_OUT_OF_RANGE'
                    ? 'Forecast N/A'
                    : weatherError === 'LOCATION_UNAVAILABLE'
                    ? 'No GPS'
                    : weatherError === 'INVALID_API_KEY'
                    ? 'Key Activating'
                    : 'Weather N/A'}
                </span>
              </div>

              {weatherError && (
                <RotateCw className={`w-3.5 h-3.5 ml-0.5 shrink-0 transition-colors ${pillTheme.retryIcon}`} />
              )}
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
