import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Plus,
  Minus,
  Navigation,
  User,
  Users,
  CheckCircle2,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AuthUser } from '../../types/auth';
import {
  subscribeAssignedJeepney,
  subscribeLiveTelemetry,
  subscribeWaitingCommuters,
  DriverAssignedVehicleBundle,
} from '../../services/databaseService';
import { WaitingCommuterRecord, LiveTelemetryRecord } from '../../types/database';
import { PRIMARY_JEEPNEY_CORRIDORS } from '../../utils/jeepneyCorridors';

interface DriverMapScreenProps {
  user: AuthUser | null;
  onSelectTab?: (tab: 'dashboard' | 'map' | 'forecast' | 'profile') => void;
}

// Distance in meters between two lat/lng coordinates (Haversine formula)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function formatDistanceText(meters: number): string {
  if (meters < 1000) {
    return `≈ ${meters} m from your location`;
  }
  return `≈ ${(meters / 1000).toFixed(1)} km from your location`;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h ago`;
}

export const DriverMapScreen: React.FC<DriverMapScreenProps> = ({ user }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const commuterMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const otherVehiclesMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const corridorLayerRef = useRef<L.Polyline | null>(null);

  // Real-time Database State
  const [bundle, setBundle] = useState<DriverAssignedVehicleBundle>({
    jeepney: null,
    telemetry: null,
    device: null,
    route: null,
  });
  const [liveTelemetries, setLiveTelemetries] = useState<LiveTelemetryRecord[]>([]);
  const [waitingCommuters, setWaitingCommuters] = useState<WaitingCommuterRecord[]>([]);
  const [deviceGpsCoords, setDeviceGpsCoords] = useState<[number, number] | null>(null);

  // UI Interactive State
  const [isDrawerMinimized, setIsDrawerMinimized] = useState(false);
  const [showAllPassengers, setShowAllPassengers] = useState(false);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCommuterId, setSelectedCommuterId] = useState<string | null>(null);

  const driverUid = user?.uid || '';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 1. Subscribe to Driver's assigned Jeepney & Telemetry
  useEffect(() => {
    if (!driverUid && !user?.email) return;
    const unsub = subscribeAssignedJeepney(
      driverUid,
      (updatedBundle) => {
        setBundle(updatedBundle);
      },
      {
        email: user?.email,
        driverId: user?.driverId,
        assignedJeepneyId: user?.assignedJeepneyId,
        assignedPlate: user?.assignedPlate,
      }
    );
    return () => unsub();
  }, [driverUid, user?.email, user?.driverId, user?.assignedJeepneyId, user?.assignedPlate]);

  // 2. Subscribe to Fleet Live Telemetry (real vehicles from RTDB)
  useEffect(() => {
    const unsub = subscribeLiveTelemetry((records) => {
      setLiveTelemetries(records);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Real Waiting Commuters from RTDB
  useEffect(() => {
    const unsub = subscribeWaitingCommuters((pings) => {
      // Filter for active waiting pings only (not expired or cancelled)
      const activePings = pings.filter(
        (p) => p.status === 'waiting' && p.pickupCoords?.lat && p.pickupCoords?.lng
      );
      setWaitingCommuters(activePings);
    });
    return () => unsub();
  }, []);

  // 4. Device GPS Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDeviceGpsCoords([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Determine Driver Coordinates: Telemetry coordinate > Device GPS > Corridor anchor
  const driverCoordinates: [number, number] = useMemo(() => {
    if (bundle.telemetry?.currentCoord && bundle.telemetry.currentCoord.length === 2) {
      return bundle.telemetry.currentCoord;
    }
    if (deviceGpsCoords) {
      return deviceGpsCoords;
    }
    // Default Manila Corridor coordinate
    return [14.6720, 121.0330];
  }, [bundle.telemetry?.currentCoord, deviceGpsCoords]);

  // Active Road Corridor: Matched from PRIMARY_JEEPNEY_CORRIDORS (same geometry as passenger-facing)
  const activeCorridor = useMemo(() => {
    const routeId = bundle.jeepney?.assignedRouteId || user?.assignedRouteId || 'route-1';
    // Match corridor or fallback to first transit corridor
    return (
      PRIMARY_JEEPNEY_CORRIDORS.find((c) => c.id === routeId || c.id === 'elliptical-road') ||
      PRIMARY_JEEPNEY_CORRIDORS[0]
    );
  }, [bundle.jeepney?.assignedRouteId, user?.assignedRouteId]);

  // Initialize Map using the same OpenStreetMap tiles as passenger-facing
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: driverCoordinates,
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
    });
    mapInstanceRef.current = map;

    // Use OpenStreetMap tiles (Identical to passenger-facing app)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Draw Active Corridor Polyline in Maroon (#800020)
    if (activeCorridor?.coords && activeCorridor.coords.length > 0) {
      const polyline = L.polyline(activeCorridor.coords, {
        color: '#800020',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);
      corridorLayerRef.current = polyline;
    }

    // Invalidate size on mount to prevent Leaflet render glitches
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Driver Marker on Live Location Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const plate = bundle.jeepney?.plateNumber || user?.assignedPlate || '—';
    const occupiedSeats = bundle.telemetry?.occupiedSeats ?? 0;
    const totalSeats = bundle.telemetry?.totalSeats ?? bundle.jeepney?.totalSeats ?? 0;
    const isFull = totalSeats > 0 && occupiedSeats >= totalSeats;

    const driverIcon = L.divIcon({
      className: 'driver-live-marker',
      html: `
        <div class="relative w-16 h-16 flex items-center justify-center select-none">
          <!-- Pulsating Maroon Radar Aura -->
          <div class="absolute w-16 h-16 rounded-full bg-[#800020]/25 animate-ping pointer-events-none"></div>
          <!-- Mid Glow Ring -->
          <div class="absolute w-12 h-12 rounded-full bg-[#800020]/35 pointer-events-none"></div>
          <!-- Center Jeep Logo Circle Pin with FlowJeep Vehicle Logo -->
          <div class="relative w-11 h-11 rounded-full bg-white border-2 border-[#800020] shadow-2xl flex items-center justify-center z-10 overflow-hidden p-0.5">
            <img src="/assets/flowjeep_vehicle_logo.png?v=2" alt="FlowJeep" class="w-full h-full object-contain pointer-events-none select-none" />
          </div>
          <!-- Plate Badge Pill Below -->
          <div class="absolute -bottom-3 z-20 whitespace-nowrap bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-200 shadow-xs flex items-center space-x-1">
            <span class="w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}"></span>
            <span class="text-[10px] font-mono font-black text-slate-800">${plate}</span>
          </div>
        </div>
      `,
      iconSize: [64, 64],
      iconAnchor: [32, 32],
    });

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng(driverCoordinates);
      driverMarkerRef.current.setIcon(driverIcon);
    } else {
      const marker = L.marker(driverCoordinates, {
        icon: driverIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 4px;">
          <div style="font-weight: 800; color: #800020; font-size: 13px;">Your Vehicle &bull; ${plate}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            Load: <strong>${occupiedSeats}/${totalSeats}</strong> seats (${isFull ? 'Full' : `${totalSeats - occupiedSeats} free`})
          </div>
          <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 4px;">
            ● IN SERVICE &bull; GPS ACTIVE
          </div>
        </div>
      `);
      driverMarkerRef.current = marker;
    }
  }, [driverCoordinates, bundle.jeepney, bundle.telemetry, user?.assignedPlate]);

  // Synchronize Real Waiting Commuter Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers that no longer exist
    commuterMarkersRef.current.forEach((marker, pingId) => {
      if (!waitingCommuters.some((p) => p.pingId === pingId)) {
        map.removeLayer(marker);
        commuterMarkersRef.current.delete(pingId);
      }
    });

    // Add or update markers for real waiting commuters
    waitingCommuters.forEach((commuter) => {
      const coord: [number, number] = [commuter.pickupCoords.lat, commuter.pickupCoords.lng];
      const distM = getDistanceMeters(
        driverCoordinates[0],
        driverCoordinates[1],
        coord[0],
        coord[1]
      );
      const distText = formatDistanceText(distM);
      const isSelected = selectedCommuterId === commuter.pingId;

      const commuterIcon = L.divIcon({
        className: 'waiting-commuter-marker',
        html: `
          <div class="relative w-14 h-14 flex items-center justify-center cursor-pointer select-none group">
            <!-- Pulsating Waiting Radar Aura -->
            <div class="absolute w-14 h-14 rounded-full ${
              isSelected ? 'bg-red-600/35 border-2 border-red-600' : 'bg-red-500/20 border border-red-500/30'
            } group-hover:bg-red-500/30 transition-all pointer-events-none"></div>
            <!-- Center Maroon User Silhouette -->
            <div class="relative w-7 h-7 rounded-full bg-[#800020] border border-white shadow-md flex items-center justify-center text-white z-10 group-hover:scale-110 transition-transform">
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
      });

      if (commuterMarkersRef.current.has(commuter.pingId)) {
        const marker = commuterMarkersRef.current.get(commuter.pingId)!;
        marker.setLatLng(coord);
        marker.setIcon(commuterIcon);
      } else {
        const marker = L.marker(coord, { icon: commuterIcon, zIndexOffset: 500 }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 4px;">
            <div style="font-weight: 800; color: #800020; font-size: 13px;">Waiting Passenger</div>
            <div style="font-size: 11px; font-weight: 600; color: #1e293b; margin-top: 2px;">
              ${commuter.pickupStopName || 'Transit Corridor Point'}
            </div>
            ${commuter.destinationName ? `<div style="font-size: 10px; color: #64748b;">Heading to: ${commuter.destinationName}</div>` : ''}
            <div style="font-size: 10.5px; color: #0288D1; font-weight: 700; margin-top: 4px;">
              ${distText} &bull; ${formatRelativeTime(commuter.timestamp)}
            </div>
          </div>
        `);
        marker.on('click', () => {
          setSelectedCommuterId(commuter.pingId);
          showToast(`Selected commuter near ${commuter.pickupStopName || 'corridor'}`);
        });
        commuterMarkersRef.current.set(commuter.pingId, marker);
      }
    });
  }, [waitingCommuters, driverCoordinates, selectedCommuterId]);

  // Synchronize other vehicles on the road from RTDB (same as passenger facing)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const myJeepneyId = bundle.jeepney?.id || '';

    otherVehiclesMarkersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    otherVehiclesMarkersRef.current.clear();

    liveTelemetries.forEach((tel) => {
      if (tel.jeepneyId === myJeepneyId || !tel.isOnline) return;
      if (!tel.currentCoord || tel.currentCoord.length !== 2) return;

      const isFull = (tel.occupiedSeats || 0) >= (tel.totalSeats || 22);
      const otherIcon = L.divIcon({
        className: 'custom-jeep-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer select-none filter drop-shadow-md">
            <div class="px-2 py-0.5 bg-white border border-[#800020]/25 rounded-full shadow-md flex items-center space-x-1 backdrop-blur-xs">
              <span class="w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-[#800020] animate-pulse'}"></span>
              <span class="text-[10px] font-mono font-bold text-slate-800">${tel.plateNumber || 'PUV'}</span>
            </div>
          </div>
        `,
        iconSize: [75, 24],
        iconAnchor: [37, 12],
      });

      const marker = L.marker([tel.currentCoord[0], tel.currentCoord[1]], { icon: otherIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 4px;">
          <div style="font-weight: 800; color: #800020; font-size: 13px;">${tel.plateNumber || 'Modern PUV'}</div>
          <div style="font-size: 11px; color: #475569;">Load: ${tel.occupiedSeats}/${tel.totalSeats} seats</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Speed: ${tel.speedKmh || 0} km/h</div>
        </div>
      `);
      otherVehiclesMarkersRef.current.set(tel.jeepneyId, marker);
    });
  }, [liveTelemetries, bundle.jeepney?.id]);

  // Recenter Map on Driver's Vehicle
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(driverCoordinates, 16, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
    showToast('Re-centered on your vehicle');
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleFocusCommuter = (commuter: WaitingCommuterRecord) => {
    setSelectedCommuterId(commuter.pingId);
    if (mapInstanceRef.current && commuter.pickupCoords) {
      mapInstanceRef.current.flyTo([commuter.pickupCoords.lat, commuter.pickupCoords.lng], 16.5, {
        duration: 1.0,
      });
      const marker = commuterMarkersRef.current.get(commuter.pingId);
      if (marker) {
        marker.openPopup();
      }
    }
    showToast(`Navigating to commuter pickup: ${commuter.pickupStopName || 'Corridor'}`);
  };

  // Processed Waiting Commuters List with Real Computed Distance & Relative Time
  const processedCommuters = useMemo(() => {
    return waitingCommuters.map((c) => {
      const distM = getDistanceMeters(
        driverCoordinates[0],
        driverCoordinates[1],
        c.pickupCoords.lat,
        c.pickupCoords.lng
      );
      return {
        ...c,
        distanceM: distM,
        distanceText: formatDistanceText(distM),
        timeAgo: formatRelativeTime(c.timestamp),
      };
    }).sort((a, b) => a.distanceM - b.distanceM);
  }, [waitingCommuters, driverCoordinates]);

  const displayedCommuters = showAllPassengers
    ? processedCommuters
    : processedCommuters.slice(0, 3);

  const routeDisplayName = bundle.route?.name || (bundle.jeepney ? 'Corridor In Progress' : 'No Route Assigned');
  const routeOrigin = bundle.route?.origin || '—';
  const routeDestination = bundle.route?.destination || '—';

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* 1. Top Floating Route Header & Dropdown */}
      <div className="absolute top-3 inset-x-3 z-[1100]">
        <div
          onClick={() => setShowRouteDropdown((prev) => !prev)}
          className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 px-4 py-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#800020]/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#800020] fill-[#800020]" />
            </div>
            <div className="flex items-center space-x-1.5 truncate">
              <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
                {routeOrigin !== '—' ? routeOrigin.split(' ')[0] : 'No Route'}
              </span>
              <span className="text-slate-400 font-normal text-sm shrink-0">→</span>
              <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
                {routeDestination !== '—' ? routeDestination.split(' ')[0] : 'Assigned'}
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
              showRouteDropdown ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Real Route & Telemetry Dropdown */}
        {showRouteDropdown && (
          <>
            {/* Click-away backdrop */}
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setShowRouteDropdown(false)}
            />
            <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150 relative z-10">
              <div className="flex justify-between items-center text-xs gap-3">
                <span className="text-slate-500 shrink-0">Corridor Name:</span>
                <span className="font-bold text-slate-800 text-right truncate">
                  {routeDisplayName}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs gap-3">
                <span className="text-slate-500 shrink-0">Assigned Unit:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {bundle.jeepney?.plateNumber || user?.assignedPlate || 'No Unit Connected'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs gap-3">
                <span className="text-slate-500 shrink-0">Driver:</span>
                <span className="font-bold text-slate-800 text-right truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Authorized Driver'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs gap-3">
                <span className="text-slate-500 shrink-0">Cooperative:</span>
                <span className="font-bold text-slate-800 text-right truncate">
                  {user?.cooperative || bundle.jeepney?.cooperative || '—'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Active Telemetry</span>
                </span>
                <span className="font-mono">
                  {bundle.telemetry?.speedKmh ? `${Math.round(bundle.telemetry.speedKmh)} km/h` : 'GPS Tracking'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Full Leaflet Map Viewport (Same map as Passenger-facing) */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 3. Floating Right Map Controls (Positioned at mid-right to prevent any header overlap) */}
      <div className="absolute right-3.5 top-1/2 -translate-y-16 z-[500] flex flex-col space-y-2.5 pointer-events-auto">
        <button
          type="button"
          onClick={handleRecenter}
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#800020] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
          title="Recenter on your vehicle"
          aria-label="Recenter GPS"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        <div className="w-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 flex flex-col items-center overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-full h-9 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div className="w-6 h-[1px] bg-slate-200" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-full h-9 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-[1001] bg-slate-900/90 text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-xs flex items-center space-x-1.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4. Bottom Sheet Drawer: Real Waiting Passengers from Database (Minimizable) */}
      <div
        className={`absolute bottom-0 inset-x-0 z-[1000] bg-white rounded-t-3xl shadow-[0_-8px_25px_-5px_rgba(0,0,0,0.12)] border-t border-slate-100 px-4 pt-2 transition-all duration-300 ease-in-out ${
          isDrawerMinimized ? 'pb-3' : 'pb-2'
        }`}
      >
        {/* Clickable Drag Handle / Bar to toggle minimize */}
        <button
          type="button"
          onClick={() => setIsDrawerMinimized((prev) => !prev)}
          className="w-full flex justify-center py-1 cursor-pointer group"
          title={isDrawerMinimized ? 'Expand waiting passengers drawer' : 'Minimize drawer'}
          aria-label={isDrawerMinimized ? 'Expand waiting passengers drawer' : 'Minimize drawer'}
        >
          <div className="w-12 h-1 bg-slate-300 group-hover:bg-slate-400 rounded-full transition-colors" />
        </button>

        {/* Drawer Header Row */}
        <div className="flex items-center justify-between mt-0.5 mb-2">
          <div
            onClick={() => setIsDrawerMinimized((prev) => !prev)}
            className="flex items-center space-x-2 cursor-pointer select-none group"
          >
            <User className="w-4.5 h-4.5 text-[#800020]" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-[#800020] transition-colors">
              Waiting Passengers Near You
            </h2>
            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600">
              ({processedCommuters.length})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {!isDrawerMinimized && processedCommuters.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllPassengers((prev) => !prev)}
                className="text-xs font-bold text-[#800020] hover:underline cursor-pointer mr-1"
              >
                {showAllPassengers ? 'Collapse' : `View All (${processedCommuters.length})`}
              </button>
            )}

            {/* Minimize / Expand Toggle Chevron Button */}
            <button
              type="button"
              onClick={() => setIsDrawerMinimized((prev) => !prev)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isDrawerMinimized ? 'Expand drawer' : 'Minimize drawer'}
              aria-label={isDrawerMinimized ? 'Expand drawer' : 'Minimize drawer'}
            >
              {isDrawerMinimized ? (
                <ChevronUp className="w-4.5 h-4.5" />
              ) : (
                <ChevronDown className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* Drawer Body (Collapsible) */}
        {!isDrawerMinimized && (
          <div className="animate-in fade-in duration-200">
            {processedCommuters.length === 0 ? (
              <div className="py-5 flex flex-col items-center justify-center text-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No Waiting Commuters Signaling</p>
                <p className="text-[11px] text-slate-400 max-w-[240px]">
                  Passenger pickup pings submitted by commuters on this corridor will stream here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pb-1">
                {displayedCommuters.map((commuter) => (
                  <div
                    key={commuter.pingId}
                    onClick={() => handleFocusCommuter(commuter)}
                    className={`border rounded-2xl p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                      selectedCommuterId === commuter.pingId
                        ? 'bg-red-50/70 border-red-200'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100 active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#800020] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4.5 h-4.5 fill-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {commuter.pickupStopName || 'Transit Corridor Stop'}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {commuter.distanceText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {commuter.timeAgo}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusCommuter(commuter);
                        }}
                        className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-[#800020] flex items-center justify-center transition-colors cursor-pointer"
                        title="Focus pickup location"
                      >
                        <Navigation className="w-3.5 h-3.5 fill-[#800020] rotate-45" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
