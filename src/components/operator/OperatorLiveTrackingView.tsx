import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Navigation, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OperatorVanIcon } from './OperatorLogo';

interface OperatorLiveTrackingViewProps {
  onBack: () => void;
  onOpenPassengerLoad?: () => void;
  routeCode?: string;
  routeName?: string;
}

export const OperatorLiveTrackingView: React.FC<OperatorLiveTrackingViewProps> = ({
  onBack,
  onOpenPassengerLoad,
  routeCode = 'Route 1',
  routeName = 'Baclaran – Monumento',
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Corridor stops for Route 1 (Baclaran to Monumento along Taft / Rizal Ave)
  const stops = [
    { name: 'Baclaran Terminal', eta: '--', isPast: false, isNext: false },
    { name: 'EDSA – Taft Station', eta: '--', isPast: false, isNext: false },
    { name: 'Libertad (Pasay)', eta: '--', isPast: false, isNext: false },
    { name: 'Taft Ave. / Gil Puyat', eta: '--', isPast: false, isNext: false },
    { name: 'Vito Cruz (DLSU)', eta: '--', isPast: false, isNext: false },
    { name: 'Quirino Ave.', eta: '--', isPast: false, isNext: false },
    { name: 'Pedro Gil (UP Manila)', eta: '--', isPast: false, isNext: false },
    { name: 'United Nations Ave.', eta: '--', isPast: false, isNext: false },
    { name: 'Doroteo Jose / Recto', eta: '--', isPast: false, isNext: false },
    { name: 'Monumento Terminal', eta: '--', isPast: false, isNext: false },
  ];

  // Coordinates along Taft / Rizal corridor
  const routeWaypoints: [number, number][] = [
    [14.5342, 120.9984], // Baclaran
    [14.5385, 120.9996], // EDSA-Taft
    [14.5475, 120.9985], // Libertad
    [14.5542, 120.9972], // Gil Puyat / Buendia
    [14.5638, 120.9951], // Vito Cruz
    [14.5702, 120.9918], // Quirino
    [14.5778, 120.9888], // Pedro Gil
    [14.5828, 120.9855], // UN Ave
    [14.6033, 120.9818], // D. Jose
    [14.6538, 120.9836], // Monumento
  ];

  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [14.555, 120.997],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Route polyline with dashed style matching design
    L.polyline(routeWaypoints, {
      color: '#DC2626',
      weight: 3.5,
      dashArray: '5, 8',
      opacity: 0.9,
    }).addTo(map);

    // Terminal Pin
    const pinIconHtml = `
      <div style="
        width: 28px;
        height: 28px;
        background: #DC2626;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid white;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `;

    L.marker([14.5342, 120.9984], {
      icon: L.divIcon({
        className: 'terminal-marker',
        html: pinIconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      }),
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode]);

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden bg-slate-50 relative select-none">
      {/* Top Header */}
      <div className="w-full bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 z-20">
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

      {/* Segmented Control: [ Map ] | [ List ] */}
      <div className="w-full bg-white px-5 pb-3 flex justify-center shrink-0 z-20 border-b border-slate-100/60 shadow-2xs">
        <div className="bg-slate-100 p-1 rounded-full flex items-center space-x-1 w-full max-w-[240px]">
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${
              viewMode === 'map'
                ? 'bg-[#DC2626] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#DC2626] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'map' ? (
        <div className="relative flex-1 w-full overflow-hidden">
          {/* Map canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Bottom Floating Info Card */}
          <div className="absolute bottom-5 left-4 right-4 z-20">
            <div
              onClick={onOpenPassengerLoad}
              className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-lg cursor-pointer hover:border-red-300 transition active:scale-[0.99]"
            >
              {/* Next Stop Row */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Next Stop
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Awaiting fleet GPS signal
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-slate-400">
                  <span>--</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Passenger Load Row */}
              <div className="pt-3">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-600">Passenger Load</span>
                  <span className="text-slate-400 font-bold">--</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: '0%' }}
                    className="h-full bg-slate-300 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List Mode View */
        <div className="flex-1 w-full overflow-y-auto px-5 py-4 space-y-2 no-scrollbar bg-slate-50">
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {stops.map((stop, idx) => (
              <div
                key={idx}
                className={`p-3.5 flex items-center justify-between ${
                  stop.isNext ? 'bg-red-50/60' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      stop.isNext
                        ? 'bg-[#DC2626] text-white'
                        : stop.isPast
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-semibold block ${
                        stop.isNext ? 'text-[#DC2626]' : 'text-slate-800'
                      }`}
                    >
                      {stop.name}
                    </span>
                    {stop.isNext && (
                      <span className="text-[10px] font-medium text-red-600">
                        Approaching next
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold ${
                    stop.isNext
                      ? 'text-[#DC2626]'
                      : stop.isPast
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  {stop.eta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
