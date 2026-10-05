import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus, Crosshair } from 'lucide-react';

interface LocationMapPreviewProps {
  coords: { lat: number; lng: number };
  name: string;
}

export const LocationMapPreview: React.FC<LocationMapPreviewProps> = ({ coords, name }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize interactive Leaflet map
  useEffect(() => {
    if (!containerRef.current) return;

    // Safety cleanup in case of hot-reload
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // FlowJeep Maroon location pin marker with bottom anchor
    const pinIcon = L.divIcon({
      className: 'flowjeep-forecast-pin',
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); pointer-events:auto; cursor:pointer;" title="${name}">
          <!-- Pulse ring -->
          <div style="position:absolute; bottom:-3px; width:14px; height:14px; background:rgba(128,0,32,0.3); border-radius:50%; transform: scale(1.4); pointer-events:none;"></div>
          <!-- Pin head -->
          <div style="width:24px; height:24px; background-color:#800020; border:2px solid #ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.35); z-index:2;">
            <svg style="width:13px; height:13px; color:#ffffff;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <!-- Pin pointer -->
          <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid #800020; margin-top:-1px; z-index:1;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([coords.lat, coords.lng], {
      icon: pinIcon,
      interactive: true,
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;
    setIsMapReady(true);

    // Initial size invalidation to guarantee clean tile load
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Keep map crisp if container width changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  // Update map center and marker when selected place coordinates change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
    markerRef.current.setLatLng([coords.lat, coords.lng]);
  }, [coords.lat, coords.lng]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    mapRef.current?.zoomOut();
  };

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    mapRef.current?.setView([coords.lat, coords.lng], 15, { animate: true });
  };

  return (
    <div className="relative w-full h-full min-h-[100px] select-none bg-slate-100">
      {/* Real Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Subtle Floating Interactive Controls */}
      {isMapReady && (
        <div
          className="absolute top-1.5 right-1.5 z-10 flex flex-col space-y-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="w-5.5 h-5.5 rounded-md bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="w-5.5 h-5.5 rounded-md bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Recenter to selected place"
            title="Recenter"
            className="w-5.5 h-5.5 rounded-md bg-white/95 hover:bg-white text-[#800020] border border-slate-200/90 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <Crosshair className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Discrete OpenStreetMap Attribution Badge */}
      <div className="absolute bottom-1 right-1 z-10 pointer-events-none">
        <span className="text-[8px] px-1 py-0.2 bg-white/85 text-slate-500 rounded font-sans backdrop-blur-2xs border border-slate-200/60 leading-none">
          © OSM
        </span>
      </div>
    </div>
  );
};
