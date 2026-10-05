import React, { useMemo } from 'react';
import { DailyForecast, DayOfWeek, LiveWeatherData } from '../../types/forecast';
import { Calendar, Users, Clock, Sun, CloudRain, Cloud, CloudSun, Info } from 'lucide-react';
import { getCurrentWeekDays } from '../../utils/dateUtils';

interface DailyOverviewCardProps {
  selectedDay: DayOfWeek;
  forecast: DailyForecast | null;
  liveWeather?: LiveWeatherData | null;
}

export const DailyOverviewCard: React.FC<DailyOverviewCardProps> = ({
  selectedDay,
  forecast,
  liveWeather,
}) => {
  const currentTemp =
    liveWeather?.temperatureC ?? forecast?.temperatureC ?? 28;
  const currentCondition =
    liveWeather?.weatherCondition ?? forecast?.weatherCondition ?? 'Partly Cloudy';
  const iconType =
    liveWeather?.weatherIconType ?? forecast?.weatherIconType ?? 'partly-cloudy';

  // Stylized weather icon matching the transit maroon palette
  const renderWeatherIcon = () => {
    if (iconType === 'sunny') return <Sun className="w-6 h-6 text-[#701a28] stroke-[1.8]" />;
    if (iconType === 'rainy') return <CloudRain className="w-6 h-6 text-[#701a28] stroke-[1.8]" />;
    if (iconType === 'cloudy') return <Cloud className="w-6 h-6 text-[#701a28] stroke-[1.8]" />;
    return <CloudSun className="w-6 h-6 text-[#701a28] stroke-[1.8]" />;
  };

  const currentWeekDays = useMemo(() => getCurrentWeekDays(), []);
  const defaultDateString = useMemo(() => {
    const found = currentWeekDays.find((d) => d.day === selectedDay);
    return found ? found.dateString : `${selectedDay}`;
  }, [currentWeekDays, selectedDay]);

  const hasData = Boolean(forecast?.peakCrowdLevel || forecast?.peakPercentage !== undefined);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
      {/* Top row: Day and Date + Weather Pill */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Calendar className="w-4.5 h-4.5 text-[#701a28] stroke-[2]" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
              Daily Schedule Overview
            </span>
          </div>
          <h2 className="text-[20px] sm:text-[23px] font-black text-[#701a28] mt-1 tracking-tight">
            {forecast?.dateString || defaultDateString}
          </h2>
        </div>

        {/* Real Live Weather condition pill */}
        <div className="flex items-center space-x-3 bg-rose-50/60 border border-rose-100/70 px-3.5 sm:px-4 py-2 rounded-2xl shrink-0">
          {renderWeatherIcon()}
          <div className="text-left">
            <span className="block text-[15px] sm:text-[16px] font-black text-slate-900 leading-tight">
              {currentTemp}°C
            </span>
            <span className="block text-[11px] sm:text-[11.5px] text-slate-500 font-medium">
              {currentCondition}
            </span>
          </div>
        </div>
      </div>

      {/* Main Metric Dual Grid: Peak Crowd Level & Recommended Travel Window */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-slate-100">
        {/* Peak Crowd Level */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Users className="w-3.5 h-3.5 text-[#701a28]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Peak Crowd Level
            </span>
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-[17px] font-extrabold text-slate-900">
              {forecast?.peakCrowdLevel || '--'}
            </span>
          </div>
          <span className="text-[10.5px] text-slate-400 block mt-0.5">
            {hasData ? 'Maximum expected corridor load' : 'Data pending collection'}
          </span>
        </div>

        {/* Recommended Travel Window */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#0288D1]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Best Travel Window
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[14px] font-bold text-slate-800">
              {forecast?.recommendedWindow || '--'}
            </span>
          </div>
          <span className="text-[10.5px] text-slate-400 block mt-0.5">
            {hasData ? 'Optimal seat availability window' : 'Data pending collection'}
          </span>
        </div>
      </div>

      {/* Clean Empty State Notice */}
      {!hasData && (
        <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="text-[11.5px] leading-relaxed">
            <span className="font-semibold text-slate-700 block">No forecast data available yet</span>
            <span className="text-slate-500">
              Corridor crowd telemetry will populate automatically once real runs are dispatched.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
