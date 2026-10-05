import React from 'react';
import { TimePeriodForecast } from '../../types/forecast';
import { Users, Clock, Info } from 'lucide-react';

interface TimeOfDayBreakdownProps {
  periods?: TimePeriodForecast[];
}

export const TimeOfDayBreakdown: React.FC<TimeOfDayBreakdownProps> = ({ periods = [] }) => {
  const hasAnyData = periods.some((p) => p.occupancyPercentage !== undefined);

  // Status color styles
  const getStatusBadge = (status?: string, pct?: number) => {
    if (pct === undefined || status === undefined) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200/80">
          Pending
        </span>
      );
    }
    if (status === 'Full / Standing' || pct >= 90) {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-[#800020] border border-red-200/90 shadow-2xs">
          Full / Standing
        </span>
      );
    }
    if (status === 'Near-Full' || pct >= 80) {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          Near-Full
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#00B14F]/10 text-[#007A37] border border-[#00B14F]/25 shadow-2xs">
        Seats Available
      </span>
    );
  };

  const getProgressColor = (pct?: number) => {
    if (pct === undefined) return 'bg-slate-200';
    if (pct >= 90) return 'bg-[#800020]';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-[#0288D1]';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Corridor Timeline
          </span>
          <h3 className="text-[15px] font-bold text-slate-900">
            Time-of-Day Occupancy Breakdown
          </h3>
        </div>
        <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-[#800020]" />
          <span className="font-semibold text-slate-500">Dispatch Windows</span>
        </div>
      </div>

      {/* Empty Notice if under development */}
      {!hasAnyData && (
        <div className="mb-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center space-x-2 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Occupancy breakdown will populate as live vehicle runs are recorded.</span>
        </div>
      )}

      {/* Chronological List of Dispatch Periods */}
      <div className="space-y-2.5">
        {periods.map((period, idx) => {
          const pct = period.occupancyPercentage;
          const total = period.totalCapacity || 22;
          const count = period.passengerCount;
          const hasPct = pct !== undefined;

          return (
            <div
              key={period.id || idx}
              className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-colors"
            >
              {/* Row 1: Period Name, Time Window, and Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                    {period.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {period.timeWindow}
                  </span>
                </div>
                {getStatusBadge(period.status, pct)}
              </div>

              {/* Row 2: Occupancy Visual Progress Bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium flex items-center">
                    <Users className="w-3 h-3 mr-1 text-slate-400" />
                    {hasPct ? `${count} / ${total} seats (${pct}%)` : `-- / ${total} seats (--%)`}
                  </span>
                  <span className="font-bold text-slate-600">
                    {hasPct ? `${pct}% capacity` : '-- capacity'}
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                    style={{ width: hasPct ? `${Math.min(100, Math.max(8, pct))}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Row 3: Operational Explanation (only shown if real data exists) */}
              {period.explanation && (
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {period.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

