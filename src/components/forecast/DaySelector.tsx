import React, { useMemo } from 'react';
import { DayOfWeek, DAYS_OF_WEEK } from '../../types/forecast';
import { getCurrentWeekDays } from '../../utils/dateUtils';

interface DaySelectorProps {
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  weeklyPeaks?: Record<DayOfWeek, number | undefined>;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDay,
  onSelectDay,
}) => {
  const currentWeek = useMemo(() => getCurrentWeekDays(), []);
  const currentWeekMap = useMemo(
    () => new Map(currentWeek.map((w) => [w.day, w])),
    [currentWeek]
  );

  return (
    <div className="w-full">
      <div className="flex items-stretch gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          const weekInfo = currentWeekMap.get(day);
          const dayNum = weekInfo?.dayNumber;
          const isToday = weekInfo?.isToday;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex-1 min-w-[44px] sm:min-w-[50px] h-[92px] sm:h-[96px] py-3 px-1 rounded-2xl flex flex-col items-center justify-between text-center transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#701a28] text-white shadow-md shadow-[#701a28]/25 scale-[1.02]'
                  : 'bg-slate-50/70 hover:bg-slate-100/70 text-slate-800 border border-slate-200/80 shadow-2xs'
              }`}
            >
              {/* Day Abbreviation: MON, TUE, WED, etc. */}
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-white/80' : 'text-slate-500'
                }`}
              >
                {day.slice(0, 3)}
              </span>

              {/* Day of the month number: 28, 29, 30, etc. */}
              <span
                className={`text-[23px] sm:text-[25px] font-black leading-none ${
                  isSelected ? 'text-white' : 'text-slate-900'
                }`}
              >
                {dayNum ?? day.slice(0, 3)}
              </span>

              {/* Bottom Indicator: TODAY pill badge or subtle dot */}
              <div className="h-5 flex items-center justify-center">
                {isToday ? (
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-white text-[#701a28]'
                        : 'bg-[#701a28] text-white shadow-2xs'
                    }`}
                  >
                    TODAY
                  </span>
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-slate-300'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
