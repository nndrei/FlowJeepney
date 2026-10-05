import React from 'react';
import { BarChart3, Info } from 'lucide-react';

export interface WeeklyForecastCardProps {
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
}

const DAY_PROFILES = [
  { day: 'Mon', pct: 95, label: '95%' },
  { day: 'Tue', pct: 88, label: '88%' },
  { day: 'Wed', pct: 82, label: '82%' },
  { day: 'Thu', pct: 86, label: '86%' },
  { day: 'Fri', pct: 98, label: '98%' },
  { day: 'Sat', pct: 64, label: '64%' },
  { day: 'Sun', pct: 48, label: '48%' },
];

export const WeeklyForecastCard: React.FC<WeeklyForecastCardProps> = ({
  selectedIndex = 0,
  onSelectIndex,
}) => {
  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            CORRIDOR TREND
          </span>
          <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
            7-Day Passenger Occupancy Forecast
          </h3>
        </div>
        <BarChart3 className="w-5 h-5 text-[#701428] shrink-0 mt-0.5" />
      </div>

      {/* Info Callout Banner */}
      <div className="mb-5 p-3 bg-slate-50/90 rounded-2xl border border-slate-100 flex items-start space-x-2.5 text-[12px] text-slate-500 leading-relaxed">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>Corridor predictive models show anticipated rush surges vs open midday runs.</span>
      </div>

      {/* 7-Day Columns with Proportional Load Bars */}
      <div className="flex items-end justify-between gap-2 sm:gap-3 px-1 mb-5">
        {DAY_PROFILES.map((item, idx) => {
          const isSelected = selectedIndex === idx;
          const barColor =
            item.pct >= 90
              ? 'bg-[#701428]'
              : item.pct >= 80
              ? 'bg-[#F59E0B]'
              : 'bg-[#00B14F]';

          return (
            <button
              key={item.day}
              type="button"
              onClick={() => onSelectIndex?.(idx)}
              className="flex-1 flex flex-col items-center group cursor-pointer transition-all focus:outline-none"
            >
              {/* Top percentage indicator */}
              <span
                className={`text-[11px] font-black mb-1.5 transition-colors ${
                  isSelected ? 'text-[#701428]' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                {item.label}
              </span>

              {/* Capsule Bar Container */}
              <div
                className={`w-full max-w-[38px] h-28 sm:h-32 rounded-2xl overflow-hidden flex flex-col justify-end p-1 transition-all ${
                  isSelected
                    ? 'bg-[#F1F5F9] ring-2 ring-[#701428]/30 shadow-xs'
                    : 'bg-[#F1F5F9] group-hover:bg-slate-100'
                }`}
              >
                {/* Proportional load fill */}
                <div
                  className={`w-full rounded-xl transition-all duration-300 ${barColor}`}
                  style={{ height: `${item.pct}%` }}
                  title={`${item.day}: ${item.pct}% load`}
                />
              </div>

              {/* Day of Week Label */}
              <span
                className={`text-[12.5px] mt-2 transition-colors ${
                  isSelected
                    ? 'text-[#701428] font-bold'
                    : 'text-slate-500 font-bold group-hover:text-slate-700'
                }`}
              >
                {item.day}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Legend */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11.5px] px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#701428] shrink-0" />
          <span className="text-slate-600 font-medium">90%+ Surge</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-slate-600 font-medium">80–89% Busy</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00B14F] shrink-0" />
          <span className="text-slate-600 font-medium">&lt;80% Open</span>
        </div>
      </div>
    </section>
  );
};
