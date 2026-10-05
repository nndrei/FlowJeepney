import React, { useState } from 'react';
import { ArrowLeft, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OperatorPassengerLoadViewProps {
  onBack: () => void;
  routeCode?: string;
  routeName?: string;
}

export const OperatorPassengerLoadView: React.FC<OperatorPassengerLoadViewProps> = ({
  onBack,
  routeCode = 'Route 1',
  routeName = 'Baclaran – Monumento',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Hourly load data matching design bar chart (6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM)
  const hourlyData = [
    { time: '6 AM', pct: 40, isCurrent: false },
    { time: '9 AM', pct: 65, isCurrent: false },
    { time: '12 PM', pct: 75, isCurrent: false },
    { time: '3 PM', pct: 90, isCurrent: false },
    { time: '6 PM', pct: 98, isCurrent: true },
    { time: '9 PM', pct: 35, isCurrent: false },
  ];

  // Radial Gauge Math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const loadPercentage = 85;
  const strokeDashoffset = circumference - (loadPercentage / 100) * circumference;

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto no-scrollbar bg-white select-none">
      {/* Top Header */}
      <div className="w-full px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold text-slate-900 leading-tight">
            {routeCode}
          </h1>
          <p className="text-[11px] text-slate-500 leading-tight">
            {routeName}
          </p>
        </div>

        <div className="w-8" />
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col items-center justify-between">
        {/* Radial Load Gauge */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="none"
              />
              {/* Red Progress Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-[#DC2626] transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Centered Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {loadPercentage}%
              </span>
              <span className="text-xs font-medium text-slate-500 mt-0.5">
                Load Capacity
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-500 font-medium block">
              Current Passengers
            </span>
            <span className="text-lg font-bold text-slate-800">
              34 <span className="text-slate-400 font-normal">/ 40</span>
            </span>
          </div>
        </div>

        {/* Load Trend Bar Chart Section */}
        <div className="w-full max-w-sm mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-900">Load Trend</h2>
            <span className="text-[10px] text-slate-400 font-medium">Today's Hourly Peak</span>
          </div>

          <div className="h-32 w-full flex items-end justify-between px-2 pt-2">
            {hourlyData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2 flex-1">
                <div className="w-full flex justify-center items-end h-24">
                  <div
                    style={{ height: `${item.pct}%` }}
                    className={`w-3.5 rounded-t-md transition-all duration-500 ${
                      item.isCurrent
                        ? 'bg-[#DC2626] shadow-2xs'
                        : 'bg-red-400/80 hover:bg-[#DC2626]'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown Drawer / Modal if opened */}
        {showDetails && (
          <div className="w-full mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Seated Occupancy</span>
              <span className="text-emerald-600 font-bold">28 / 28 (100%)</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Standing Capacity</span>
              <span className="text-amber-600 font-bold">6 / 12 (50%)</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Total Alighted Today</span>
              <span className="text-slate-800 font-bold">142 passengers</span>
            </div>
          </div>
        )}

        {/* Bottom Action Button */}
        <div className="w-full max-w-sm mt-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-3 px-4 bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] text-white text-xs font-semibold rounded-2xl transition shadow-xs cursor-pointer"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
};
