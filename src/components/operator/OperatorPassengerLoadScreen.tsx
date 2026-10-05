import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Cpu, Eye, ShieldAlert, X } from 'lucide-react';

interface OperatorPassengerLoadScreenProps {
  routeId?: string;
  onBack: () => void;
}

export const OperatorPassengerLoadScreen: React.FC<OperatorPassengerLoadScreenProps> = ({
  routeId = 'route-1',
  onBack,
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Gauge calculation
  // Radius = 65, circumference = 2 * PI * 65 = 408.4
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const percentage = 85;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Hourly load trend data matching mockup
  const trendHours = [
    { time: '6 AM', value: 45, isPast: true },
    { time: '9 AM', value: 68, isPast: true },
    { time: '12 PM', value: 85, isPast: true },
    { time: '3 PM', value: 72, isPast: true },
    { time: '6 PM', value: 92, isPast: false }, // Upcoming evening peak
    { time: '9 PM', value: 40, isPast: false },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white text-slate-800 select-none overflow-y-auto no-scrollbar pb-6 relative">
      {/* 1. Header with Back Arrow */}
      <div className="w-full px-4 pt-3.5 pb-2.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Route 1</h1>
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Baclaran – Monumento
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E31B23]">
          Near Max Load
        </span>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 px-5 pt-3 space-y-6">
        {/* 2. Circular Radial Progress Gauge matching 05_operator_passenger_load.png */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background circle track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-100"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Progress ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#E31B23"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight">85%</span>
              <span className="text-xs font-semibold text-slate-400 mt-0.5">Load Capacity</span>
            </div>
          </div>

          {/* Current Passenger Count */}
          <div className="text-center mt-2">
            <p className="text-xs font-medium text-slate-400">Current Passengers</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">34 / 40</p>
          </div>
        </div>

        {/* 3. Load Trend Section matching 05_operator_passenger_load.png */}
        <div className="pt-2">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Load Trend</h2>

          {/* Bar Chart Container */}
          <div className="w-full bg-[#F8FAFC] border border-slate-100 rounded-2xl p-4">
            <div className="flex items-end justify-between h-36 px-2 gap-2">
              {trendHours.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg relative flex items-end overflow-hidden h-full">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        item.isPast
                          ? 'bg-gradient-to-t from-[#B91C1C] via-[#DC2626] to-[#E31B23] shadow-xs'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${item.value}%` }}
                    />
                  </div>
                  {/* Time label */}
                  <span className="text-[10px] font-semibold text-slate-400 mt-2 shrink-0">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Action: View Details Button */}
      <div className="px-5 pt-3 shrink-0">
        <button
          type="button"
          onClick={() => setShowAuditModal(true)}
          className="w-full py-3.5 px-4 bg-[#E31B23] hover:bg-[#C81017] active:bg-[#B91C1C] text-white text-sm font-bold rounded-2xl shadow-md transition-colors cursor-pointer text-center"
        >
          View Details
        </button>
      </div>

      {/* 5. Sensor Fusion Audit Details Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-[#E31B23]" />
                <h3 className="text-base font-bold text-slate-900">Sensor Fusion Audit</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sensor Fusion Stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
                  <Eye className="w-3.5 h-3.5 text-[#E31B23]" />
                  <span>YOLOv8n Camera</span>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-1">34 In-Cabin</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  98.4% Confidence
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>IR Beam Sensor</span>
                </div>
                <p className="text-xl font-bold text-slate-900 mt-1">35 Boarded</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Entry/Exit Verified</p>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Recent Passenger Events</p>
              <div className="divide-y divide-slate-100 text-xs border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">EDSA / Taft (Stop 2)</span>
                  <span className="font-bold text-emerald-600">+4 Boarded / -2 Alighted</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">Heritage Hotel</span>
                  <span className="font-bold text-emerald-600">+2 Boarded / -1 Alighted</span>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-600">Baclaran Terminal</span>
                  <span className="font-bold text-slate-800">Initial Dispatch: 31</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAuditModal(false)}
              className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Close Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
