import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Minus, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OperatorDemandMapViewProps {
  onBack?: () => void;
}

export const OperatorDemandMapView: React.FC<OperatorDemandMapViewProps> = ({ onBack }) => {
  const [zoomLevel, setZoomLevel] = useState<'out' | 'in'>('in');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Demand hotspots in NCR transit corridors (Taft, Cubao, Gil Puyat, EDSA, Manila City Hall)
  const hotspots = [
    {
      lat: 14.5542,
      lng: 120.9972,
      intensity: 'high',
      radius: 400,
      label: 'High Demand (12 people)',
      station: 'Taft Ave. / Buendia',
    },
    {
      lat: 14.5385,
      lng: 120.9996,
      intensity: 'high',
      radius: 350,
      label: 'High Demand (9 people)',
      station: 'EDSA – Taft Rotonda',
    },
    {
      lat: 14.5638,
      lng: 120.9951,
      intensity: 'medium',
      radius: 280,
      label: 'Medium Demand (6 people)',
      station: 'Vito Cruz',
    },
    {
      lat: 14.5778,
      lng: 120.9888,
      intensity: 'medium',
      radius: 250,
      label: 'Medium Demand (5 people)',
      station: 'Pedro Gil',
    },
    {
      lat: 14.5828,
      lng: 120.9855,
      intensity: 'low',
      radius: 200,
      label: 'Low Demand (2 people)',
      station: 'UN Avenue',
    },
    {
      lat: 14.5475,
      lng: 120.9985,
      intensity: 'medium',
      radius: 260,
      label: 'Medium Demand (4 people)',
      station: 'Libertad',
    },
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const centerCoord: [number, number] = [14.5542, 120.9972];
    const initialZoom = zoomLevel === 'in' ? 14 : 12;

    const map = L.map(mapContainerRef.current, {
      center: centerCoord,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add radiant glowing demand circles
    hotspots.forEach((spot) => {
      const color =
        spot.intensity === 'high'
          ? '#DC2626'
          : spot.intensity === 'medium'
          ? '#F97316'
          : '#94A3B8';

      // Outer glow circle
      L.circle([spot.lat, spot.lng], {
        radius: spot.radius,
        color: 'transparent',
        fillColor: color,
        fillOpacity: 0.28,
      }).addTo(map);

      // Inner core circle
      L.circle([spot.lat, spot.lng], {
        radius: spot.radius * 0.45,
        color: color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.65,
      }).addTo(map);

      // Add High Demand Callout Pin for the top hotspot
      if (spot.intensity === 'high' && spot.station.includes('Buendia')) {
        const calloutHtml = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -100%);
          ">
            <div style="
              background: white;
              padding: 5px 10px;
              border-radius: 9999px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.18);
              border: 1px solid #FCA5A5;
              display: flex;
              align-items: center;
              gap: 6px;
              white-space: nowrap;
              font-family: inherit;
            ">
              <span style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #DC2626;
                display: inline-block;
              "></span>
              <span style="
                font-size: 11px;
                font-weight: 700;
                color: #1E293B;
              ">${spot.label}</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid white;
              margin-top: -1px;
            "></div>
          </div>
        `;

        L.marker([spot.lat, spot.lng], {
          icon: L.divIcon({
            className: 'demand-callout-marker',
            html: calloutHtml,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
        }).addTo(map);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [zoomLevel]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!mapInstanceRef.current) return;
    if (direction === 'in') {
      mapInstanceRef.current.zoomIn();
    } else {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleLocateCenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([14.5542, 120.9972], 14, { duration: 0.8 });
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden bg-slate-50 relative select-none">
      {/* Top Header */}
      <div className="w-full bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-sm font-bold text-slate-900 leading-tight">
            Demand Map
          </h1>
        </div>

        {/* Zoomed Out | Zoomed In Toggle */}
        <div className="bg-slate-100 p-0.5 rounded-full flex items-center space-x-0.5">
          <button
            onClick={() => setZoomLevel('out')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition cursor-pointer ${
              zoomLevel === 'out'
                ? 'bg-[#DC2626] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Zoomed Out
          </button>
          <button
            onClick={() => setZoomLevel('in')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition cursor-pointer ${
              zoomLevel === 'in'
                ? 'bg-[#DC2626] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Zoomed In
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 w-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Zoom & Locate Controls (Right side) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
          <div className="bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
            <button
              onClick={() => handleZoom('in')}
              className="p-2.5 hover:bg-slate-100 text-slate-700 transition border-b border-slate-100 cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="p-2.5 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleLocateCenter}
            className="p-2.5 bg-white/95 backdrop-blur-xs hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shadow-md transition cursor-pointer"
            title="Recenter"
          >
            <Crosshair className="w-4 h-4 text-[#DC2626]" />
          </button>
        </div>

        {/* Bottom Demand Legend */}
        <div className="absolute bottom-5 left-4 right-4 z-20">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl py-2.5 px-4 shadow-lg flex items-center justify-around text-xs font-semibold text-slate-700">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              <span>High Demand</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
              <span>Medium Demand</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
              <span>Low Demand</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
