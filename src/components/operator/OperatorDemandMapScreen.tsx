import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Crosshair, MapPin } from 'lucide-react';
import { DemandHotspot } from './types';

interface OperatorDemandMapScreenProps {
  onBack: () => void;
}

const DEMAND_HOTSPOTS: DemandHotspot[] = [
  {
    id: 'hotspot-1',
    stopName: 'Taft Ave. / Gil Puyat (Buendia)',
    waitingCount: 12,
    demandLevel: 'high',
    lat: 14.5547,
    lng: 120.9972,
    lastUpdated: '1 min ago',
  },
  {
    id: 'hotspot-2',
    stopName: 'EDSA / Taft Station',
    waitingCount: 8,
    demandLevel: 'medium',
    lat: 14.5378,
    lng: 121.0014,
    lastUpdated: 'Just now',
  },
  {
    id: 'hotspot-3',
    stopName: 'Monumento Circle',
    waitingCount: 15,
    demandLevel: 'high',
    lat: 14.6544,
    lng: 120.9839,
    lastUpdated: '2 mins ago',
  },
  {
    id: 'hotspot-4',
    stopName: 'Pedro Gil PGH',
    waitingCount: 5,
    demandLevel: 'medium',
    lat: 14.5779,
    lng: 120.9897,
    lastUpdated: '4 mins ago',
  },
  {
    id: 'hotspot-5',
    stopName: 'Baclaran Terminal',
    waitingCount: 3,
    demandLevel: 'low',
    lat: 14.5342,
    lng: 120.9984,
    lastUpdated: '5 mins ago',
  },
];

export const OperatorDemandMapScreen: React.FC<OperatorDemandMapScreenProps> = ({ onBack }) => {
  const [zoomLevel, setZoomLevel] = useState<'out' | 'in'>('in');
  const [activeHotspot, setActiveHotspot] = useState<DemandHotspot>(DEMAND_HOTSPOTS[0]);

  return (
    <div className="w-full h-full flex flex-col bg-[#F8FAFC] text-slate-800 select-none overflow-hidden pb-16 relative">
      {/* 1. Header with Back Arrow */}
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
            <h1 className="text-base font-bold text-slate-900 leading-tight">Demand Map</h1>
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Real-time commuter wait clusters
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-[#E31B23]">
          Live Signals
        </span>
      </div>

      {/* 2. Top View Toggle: Zoomed Out vs Zoomed In (matching mockup) */}
      <div className="w-full px-5 py-2.5 bg-white shrink-0 z-20 flex justify-center">
        <div className="w-full max-w-xs flex rounded-full bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setZoomLevel('out')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
              zoomLevel === 'out'
                ? 'bg-[#E31B23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Zoomed Out
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel('in')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
              zoomLevel === 'in'
                ? 'bg-[#E31B23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Zoomed In
          </button>
        </div>
      </div>

      {/* 3. Map Surface with Clustered Heat Circles matching 06_operator_demand_map.png */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-100">
        <svg
          className="w-full h-full"
          viewBox={zoomLevel === 'in' ? '0 0 390 480' : '0 0 550 680'}
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Street Grid pattern */}
            <pattern id="demandStreetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>
            {/* Diagonal avenue pattern */}
            <pattern
              id="demandDiagonalGrid"
              width="90"
              height="90"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 90 90" fill="none" stroke="#EDF2F7" strokeWidth="2.2" />
              <path d="M 90 0 L 0 90" fill="none" stroke="#EDF2F7" strokeWidth="1.2" />
            </pattern>

            {/* Radial Gradient for High Demand Heat Rings */}
            <radialGradient id="heatHigh" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#EF4444" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#F87171" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0" />
            </radialGradient>

            {/* Radial Gradient for Medium Demand */}
            <radialGradient id="heatMed" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F87171" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#FCA5A5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FEE2E2" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Map Surface */}
          <rect width="100%" height="100%" fill="#F8FAFC" />
          <rect width="100%" height="100%" fill="url(#demandStreetGrid)" />
          <rect width="100%" height="100%" fill="url(#demandDiagonalGrid)" opacity="0.6" />

          {/* Transit Corridors */}
          <path
            d="M 50 420 L 150 330 L 195 240 L 260 160 L 320 90"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* CLUSTER 1: Top Right Cluster (near Monumento / Balintawak) */}
          <circle cx="280" cy="180" r="42" fill="url(#heatHigh)" />
          <circle cx="280" cy="180" r="14" fill="#DC2626" fillOpacity="0.8" />
          <circle cx="280" cy="180" r="4" fill="white" />

          {/* CLUSTER 2: Top Center Cluster */}
          <circle cx="225" cy="170" r="30" fill="url(#heatMed)" />
          <circle cx="225" cy="170" r="8" fill="#EF4444" fillOpacity="0.8" />

          {/* CLUSTER 3: Top Left Cluster */}
          <circle cx="95" cy="165" r="40" fill="url(#heatHigh)" />
          <circle cx="95" cy="165" r="14" fill="#DC2626" fillOpacity="0.8" />
          <circle cx="95" cy="165" r="3.5" fill="white" />

          {/* CLUSTER 4: Mid-Left Cluster */}
          <circle cx="135" cy="190" r="36" fill="url(#heatHigh)" />
          <circle cx="135" cy="190" r="12" fill="#DC2626" fillOpacity="0.8" />

          {/* CLUSTER 5: Mid-Lower Cluster (Taft Ave. / Gil Puyat) -> MAIN HIGH DEMAND CALLOUT */}
          <circle cx="195" cy="275" r="50" fill="url(#heatHigh)" />
          <circle cx="195" cy="275" r="18" fill="#DC2626" fillOpacity="0.9" />
          <circle cx="195" cy="275" r="5" fill="white" />

          {/* CLUSTER 6: Lower South Cluster (Baclaran) */}
          <circle cx="215" cy="375" r="44" fill="url(#heatHigh)" />
          <circle cx="215" cy="375" r="14" fill="#DC2626" fillOpacity="0.85" />
          <circle cx="215" cy="375" r="4" fill="white" />

          {/* CLUSTER 7: Lower Left Small Cluster */}
          <circle cx="145" cy="340" r="30" fill="url(#heatMed)" />
          <circle cx="145" cy="340" r="8" fill="#F87171" fillOpacity="0.8" />

          {/* Station Stop Icon Pin (Nearby Transit Station) */}
          <g transform="translate(188, 140)">
            <circle cx="16" cy="16" r="16" fill="white" stroke="#CBD5E1" strokeWidth="1" />
            <path
              d="M16 8C13 8 10.5 10.5 10.5 13.5C10.5 17.5 16 23 16 23C16 23 21.5 17.5 21.5 13.5C21.5 10.5 19 8 16 8Z"
              fill="#1E293B"
            />
            <circle cx="16" cy="13.5" r="2" fill="white" />
          </g>

          {/* CALLOUT BADGE MATCHING MOCKUP: "High Demand (12 people)" */}
          <g
            transform="translate(145, 205)"
            className="cursor-pointer"
            onClick={() => setActiveHotspot(DEMAND_HOTSPOTS[0])}
          >
            {/* White rounded speech-bubble tooltip */}
            <rect
              x="0"
              y="0"
              width="155"
              height="40"
              rx="12"
              fill="white"
              stroke="#E2E8F0"
              strokeWidth="1"
              filter="drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.1))"
            />
            {/* Triangle pointer pointing down to cluster */}
            <polygon points="50,40 58,48 66,40" fill="white" />
            {/* Red map pin inside callout */}
            <circle cx="22" cy="20" r="10" fill="#E31B23" />
            <circle cx="22" cy="20" r="4" fill="white" />
            {/* Text inside callout */}
            <text x="38" y="17" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="sans-serif">
              High Demand
            </text>
            <text x="38" y="30" fill="#64748B" fontSize="10" fontWeight="500" fontFamily="sans-serif">
              (12 people)
            </text>
          </g>
        </svg>

        {/* Map Control Buttons on Top Right matching 06_operator_demand_map.png */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => setZoomLevel('in')}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel('out')}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveHotspot(DEMAND_HOTSPOTS[0])}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Recenter"
          >
            <Crosshair className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Legend matching 06_operator_demand_map.png */}
      <div className="w-full bg-white px-5 py-3 border-t border-slate-100 shrink-0 z-20 flex items-center justify-around text-xs font-semibold text-slate-700 shadow-2xs">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#E31B23]" />
          <span>High Demand</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#F87171]" />
          <span>Medium Demand</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#E2E8F0]" />
          <span>Low Demand</span>
        </div>
      </div>
    </div>
  );
};
