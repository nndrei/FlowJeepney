import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Navigation, Clock, Users } from 'lucide-react';
import { StopCheckpoint } from './types';

interface OperatorLiveTrackingScreenProps {
  routeId?: string;
  onBack: () => void;
  onNavigateToPassengerLoad: (routeId: string) => void;
}

const ROUTE_1_STOPS: StopCheckpoint[] = [
  {
    id: 'stop-baclaran',
    name: 'Baclaran Terminal',
    etaMinutes: 0,
    isPassed: true,
    passengerCount: 38,
    distanceKm: 0,
    lat: 14.5342,
    lng: 120.9984,
  },
  {
    id: 'stop-edsa-taft',
    name: 'EDSA / Taft Ave. Station',
    etaMinutes: 0,
    isPassed: true,
    passengerCount: 36,
    distanceKm: 1.2,
    lat: 14.5378,
    lng: 121.0014,
  },
  {
    id: 'stop-gil-puyat',
    name: 'Taft Ave. / Gil Puyat (Buendia)',
    etaMinutes: 2,
    isNext: true,
    passengerCount: 34,
    distanceKm: 2.5,
    lat: 14.5547,
    lng: 120.9972,
  },
  {
    id: 'stop-quirino',
    name: 'Quirino Ave. / Taft',
    etaMinutes: 7,
    passengerCount: 29,
    distanceKm: 4.1,
    lat: 14.5702,
    lng: 120.9918,
  },
  {
    id: 'stop-pedro-gil',
    name: 'Pedro Gil / PGH Station',
    etaMinutes: 11,
    passengerCount: 24,
    distanceKm: 5.3,
    lat: 14.5779,
    lng: 120.9897,
  },
  {
    id: 'stop-un-ave',
    name: 'United Nations Ave.',
    etaMinutes: 14,
    passengerCount: 20,
    distanceKm: 6.2,
    lat: 14.5828,
    lng: 120.9846,
  },
  {
    id: 'stop-monumento',
    name: 'Monumento Circle Terminal',
    etaMinutes: 28,
    passengerCount: 15,
    distanceKm: 14.8,
    lat: 14.6544,
    lng: 120.9839,
  },
];

export const OperatorLiveTrackingScreen: React.FC<OperatorLiveTrackingScreenProps> = ({
  routeId = 'route-1',
  onBack,
  onNavigateToPassengerLoad,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] text-slate-800 select-none overflow-hidden pb-16 relative">
      {/* 1. Header with Back Arrow and Title */}
      <div className="w-full px-4 pt-3.5 pb-2.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-20 shadow-2xs">
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

        {/* Status indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Shift</span>
        </div>
      </div>

      {/* 2. Mode Toggle Pills matching mockup: Map (red) vs List */}
      <div className="w-full px-5 py-2.5 bg-white shrink-0 z-20 flex justify-center">
        <div className="w-full max-w-xs flex rounded-full bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
              viewMode === 'map'
                ? 'bg-[#E31B23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
              viewMode === 'list'
                ? 'bg-[#E31B23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* 3. Main Content: Map or List View */}
      {viewMode === 'map' ? (
        <div className="relative flex-1 w-full overflow-hidden bg-slate-100">
          {/* Custom SVG Transit Canvas matching 04_operator_live_tracking.png */}
          <div className="absolute inset-0 w-full h-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 390 480"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Background road grid pattern */}
                <pattern id="streetGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#E2E8F0" strokeWidth="1.2" />
                  <path d="M 0 30 L 60 30" fill="none" stroke="#F1F5F9" strokeWidth="0.8" />
                  <path d="M 30 0 L 30 60" fill="none" stroke="#F1F5F9" strokeWidth="0.8" />
                </pattern>
                {/* Diagonal secondary avenues */}
                <pattern id="diagonalStreets" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 0 0 L 100 100" fill="none" stroke="#EDF2F7" strokeWidth="2.5" />
                  <path d="M 100 0 L 0 100" fill="none" stroke="#EDF2F7" strokeWidth="1.5" />
                </pattern>
                {/* Glow filter for active vehicle */}
                <filter id="vehicleGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Map background fill */}
              <rect width="100%" height="100%" fill="#F8FAFC" />
              {/* City blocks & street grid */}
              <rect width="100%" height="100%" fill="url(#streetGrid)" />
              <rect width="100%" height="100%" fill="url(#diagonalStreets)" opacity="0.6" />

              {/* Route 1 Crimson Polyline Corridor (Matching screenshot trajectory) */}
              <path
                d="M 105 385 L 125 330 L 110 270 L 140 230 L 195 210 L 250 170 L 290 125 L 320 85"
                fill="none"
                stroke="#E31B23"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Route halo */}
              <path
                d="M 105 385 L 125 330 L 110 270 L 140 230 L 195 210 L 250 170 L 290 125 L 320 85"
                fill="none"
                stroke="#E31B23"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.2"
              />

              {/* Intermediate Stop 1 (Baclaran - South) */}
              <circle cx="105" cy="385" r="4" fill="#E31B23" />
              <g transform="translate(85, 345)">
                <circle cx="18" cy="18" r="16" fill="#E31B23" />
                <circle cx="18" cy="18" r="14" fill="#E31B23" stroke="white" strokeWidth="2" />
                {/* Jeepney symbol inside pin */}
                <path d="M12 15h12v5h-12z" fill="white" />
                <circle cx="14" cy="21" r="1.5" fill="white" />
                <circle cx="22" cy="21" r="1.5" fill="white" />
              </g>

              {/* Intermediate Stop 2 (EDSA / Taft) */}
              <circle cx="125" cy="330" r="3.5" fill="#E31B23" />
              <g transform="translate(100, 260)">
                <circle cx="18" cy="18" r="16" fill="#E31B23" />
                <circle cx="18" cy="18" r="14" fill="#E31B23" stroke="white" strokeWidth="2" />
                <path d="M12 15h12v5h-12z" fill="white" />
                <circle cx="14" cy="21" r="1.5" fill="white" />
                <circle cx="22" cy="21" r="1.5" fill="white" />
              </g>

              {/* OPERATOR'S CURRENT VEHICLE: Pulsing Blue Marker (at Gil Puyat intersection) */}
              <g transform="translate(195, 210)">
                {/* Outer pulsing ring */}
                <circle cx="0" cy="0" r="18" fill="#3B82F6" fillOpacity="0.25">
                  <animate attributeName="r" values="14;24;14" dur="2s" repeatCount="indefinite" />
                  <animate
                    attributeName="fill-opacity"
                    values="0.35;0.05;0.35"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Outer solid blue circle with white border */}
                <circle cx="0" cy="0" r="12" fill="#0288D1" stroke="white" strokeWidth="3" />
                {/* Center dot */}
                <circle cx="0" cy="0" r="5" fill="white" />
              </g>

              {/* Peer Vehicle 1 (Ahead on Quirino) */}
              <g transform="translate(260, 160)">
                <circle cx="18" cy="18" r="18" fill="#E31B23" fillOpacity="0.15" />
                <circle cx="18" cy="18" r="15" fill="#E31B23" stroke="white" strokeWidth="2" />
                <path d="M11 14h14v5h-14z" fill="white" />
                <circle cx="14" cy="20" r="1.5" fill="white" />
                <circle cx="22" cy="20" r="1.5" fill="white" />
              </g>

              {/* Peer Vehicle 2 (Ahead near Monumento) */}
              <g transform="translate(305, 95)">
                <circle cx="16" cy="16" r="16" fill="#E31B23" fillOpacity="0.15" />
                <circle cx="16" cy="16" r="13" fill="#E31B23" stroke="white" strokeWidth="2" />
                <path d="M10 13h12v4h-12z" fill="white" />
              </g>

              {/* Compass / Location Indicator on Top Right */}
              <g transform="translate(340, 20)">
                <circle cx="16" cy="16" r="16" fill="white" stroke="#CBD5E1" strokeWidth="1" />
                <polygon points="16,8 20,20 16,17 12,20" fill="#E31B23" />
                <polygon points="16,24 20,20 16,17 12,20" fill="#94A3B8" />
              </g>
            </svg>
          </div>

          {/* 4. Bottom Floating Card matching mockup */}
          <div className="absolute bottom-3 left-4 right-4 z-30">
            <button
              type="button"
              onClick={() => onNavigateToPassengerLoad(routeId)}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200/90 shadow-lg text-left cursor-pointer transition-all hover:border-slate-300 group"
            >
              {/* Next Stop Row */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Next Stop
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#E31B23] transition-colors mt-0.5">
                    Taft Ave. / Gil Puyat
                  </h3>
                </div>
                <div className="flex items-center space-x-1 text-slate-500 group-hover:text-[#E31B23] transition-colors">
                  <span className="text-xs font-bold text-slate-700">2 min</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Passenger Load Bar Indicator (85%) */}
              <div className="pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Passenger Load</span>
                  <span className="text-xs font-extrabold text-[#E31B23] px-2 py-0.5 rounded-full bg-red-50">
                    85%
                  </span>
                </div>
                {/* Red Fill Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-[#E31B23] rounded-full transition-all duration-500"
                    style={{ width: '85%' }}
                  />
                </div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* List Mode: Stop-by-Stop Corridor Breakdown */
        <div className="flex-1 w-full overflow-y-auto no-scrollbar px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-bold text-slate-700">Corridor Checkpoints</span>
            <span className="text-[11px] font-medium text-slate-400">7 Stops • 14.8 km</span>
          </div>

          {ROUTE_1_STOPS.map((stop, idx) => (
            <div
              key={stop.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                stop.isNext
                  ? 'bg-white border-[#E31B23] shadow-xs'
                  : stop.isPassed
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-white border-slate-200/80 text-slate-800 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      stop.isNext
                        ? 'bg-[#E31B23] text-white shadow-2xs'
                        : stop.isPassed
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p
                        className={`text-xs font-bold ${
                          stop.isNext ? 'text-[#E31B23]' : 'text-slate-900'
                        }`}
                      >
                        {stop.name}
                      </p>
                      {stop.isNext && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-red-100 text-[#E31B23]">
                          Next Stop
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {stop.distanceKm} km from terminal
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      stop.isNext ? 'text-[#E31B23]' : 'text-slate-700'
                    }`}
                  >
                    {stop.isPassed ? 'Passed' : `~${stop.etaMinutes} min`}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 justify-end mt-0.5">
                    <Users className="w-3 h-3" />
                    <span>{stop.passengerCount}/40</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
