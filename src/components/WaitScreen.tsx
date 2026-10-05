import React, { useState, useEffect } from 'react';
import {
  Menu,
  Radio,
  MapPin,
  Compass,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  Search,
} from 'lucide-react';
import { ModernJeepneyVehicle, ModernJeepneyRoute, LOCAL_VECTOR_CORRIDORS } from '../utils/jeepneyCorridors';
import { WaitStatus } from '../types/waitStatus';

export interface MatchedVehicleItem {
  vehicle: ModernJeepneyVehicle;
  route: ModernJeepneyRoute;
  etaMinutes: number;
  distanceToPickupKm: number;
}

interface WaitScreenProps {
  matchingVehicles: MatchedVehicleItem[];
  pickupCoords: { lat: number; lng: number } | null;
  pickupStopName?: string;
  destinationCoords: { lat: number; lng: number } | null;
  destinationName?: string;
  onOpenMenu: () => void;
  onViewOnMap: (vehicle: ModernJeepneyVehicle) => void;
  onSelectCorridor: (corridor: (typeof LOCAL_VECTOR_CORRIDORS)[0]) => void;
  onSearchTrip?: () => void;
}

// Helper to determine sector & approximate nearest landmark for a coordinate
function getVehicleSectorAndStop(coord: [number, number], routeName: string): { stop: string; sector: string } {
  const [lat, lng] = coord;
  let stop = 'Main Transit Corridor';
  let sector = 'Commonwealth - Quezon Ave';

  if (lat > 14.67) {
    stop = 'Near Litex / Fairview';
    sector = 'Commonwealth North Sector';
  } else if (lat > 14.65) {
    stop = 'Near Philcoa / UP Diliman';
    sector = 'QC Circle Interchange';
  } else if (lat > 14.63) {
    stop = 'Near Timog / Fisher Mall';
    sector = 'Quezon Ave Midtown Sector';
  } else if (lat > 14.61) {
    stop = 'Near Welcome Rotonda';
    sector = 'QC - Manila Boundary';
  } else if (lat > 14.60) {
    stop = 'Near UST / España Blvd';
    sector = 'University Belt Sector';
  } else if (lat > 14.58) {
    stop = 'Near Quiapo / Lawton';
    sector = 'Downtown Manila Sector';
  } else {
    stop = 'Near Buendia / Taft Ave';
    sector = 'South LRT-1 Corridor';
  }

  if (routeName.includes('SM North')) {
    sector = 'North Ave - EDSA Corridor';
  }

  return { stop, sector };
}

export const WaitScreen: React.FC<WaitScreenProps> = ({
  matchingVehicles,
  pickupCoords,
  pickupStopName,
  destinationCoords,
  destinationName,
  onOpenMenu,
  onViewOnMap,
  onSelectCorridor,
  onSearchTrip,
}) => {
  // Per-vehicle ping state: map of vehicle.id -> WaitStatus
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<string, WaitStatus>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('flowjeep_active_ping');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.vehicleId && parsed.status) {
            // Check if not expired (10 minutes)
            if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
              return { [parsed.vehicleId]: parsed.status };
            }
          }
        }
      } catch {
        // ignore
      }
    }
    return {};
  });

  // Track the single active ping vehicle ID
  const [activePingVehicleId, setActivePingVehicleId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('flowjeep_active_ping');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.vehicleId && Date.now() - parsed.timestamp < 10 * 60 * 1000) {
            return parsed.vehicleId;
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Dialog state for switching active ping
  const [pendingSwitchVehicle, setPendingSwitchVehicle] = useState<MatchedVehicleItem | null>(null);

  // Timer reference map for simulation
  const [timers, setTimers] = useState<Record<string, NodeJS.Timeout[]>>({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timers).forEach((timerList) => {
        timerList.forEach((t) => clearTimeout(t));
      });
    };
  }, [timers]);

  // Broadcast and persist ping state
  const publishPing = (vehicle: ModernJeepneyVehicle, status: WaitStatus) => {
    const payload = {
      vehicleId: vehicle.id,
      routeId: vehicle.routeId,
      routeCode: vehicle.routeCode,
      plateNumber: vehicle.plateNumber,
      passengerCoords: pickupCoords || { lat: 14.6538, lng: 121.0505 },
      passengerStopName: pickupStopName || 'Current Location',
      timestamp: Date.now(),
      status,
    };

    try {
      localStorage.setItem('flowjeep_active_ping', JSON.stringify(payload));
    } catch {
      // ignore
    }

    // Publish event across window (telemetry channel)
    window.dispatchEvent(new CustomEvent('flowjeep:passenger_ping', { detail: payload }));
  };

  const handleStartPing = (item: MatchedVehicleItem) => {
    const { vehicle } = item;

    // Check if another vehicle is already actively pinged
    if (activePingVehicleId && activePingVehicleId !== vehicle.id) {
      const currentStatus = vehicleStatuses[activePingVehicleId];
      if (currentStatus && currentStatus !== 'idle' && currentStatus !== 'expired') {
        setPendingSwitchVehicle(item);
        return;
      }
    }

    executePing(item);
  };

  const executePing = (item: MatchedVehicleItem) => {
    const { vehicle } = item;

    // Cancel any previous vehicle ping timers
    if (activePingVehicleId && timers[activePingVehicleId]) {
      timers[activePingVehicleId].forEach((t) => clearTimeout(t));
    }

    // Set previous vehicle back to idle
    if (activePingVehicleId && activePingVehicleId !== vehicle.id) {
      setVehicleStatuses((prev) => ({
        ...prev,
        [activePingVehicleId]: 'idle',
      }));
    }

    setActivePingVehicleId(vehicle.id);
    setVehicleStatuses((prev) => ({
      ...prev,
      [vehicle.id]: 'waiting',
    }));

    publishPing(vehicle, 'waiting');

    // Simulate State Transitions:
    // 1. 'waiting' -> 2.5s -> 'acknowledged' (Driver notified)
    const t1 = setTimeout(() => {
      setVehicleStatuses((prev) => ({
        ...prev,
        [vehicle.id]: 'acknowledged',
      }));
      publishPing(vehicle, 'acknowledged');

      // 2. 'acknowledged' -> 3s -> 'arriving' (Arriving · ETA Xm)
      const t2 = setTimeout(() => {
        setVehicleStatuses((prev) => ({
          ...prev,
          [vehicle.id]: 'arriving',
        }));
        publishPing(vehicle, 'arriving');

        // 3. Auto-expire after 10 minutes or jeep passes
        const t3 = setTimeout(() => {
          setVehicleStatuses((prev) => ({
            ...prev,
            [vehicle.id]: 'expired',
          }));
          setActivePingVehicleId(null);
          publishPing(vehicle, 'expired');
          try {
            localStorage.removeItem('flowjeep_active_ping');
          } catch {}
        }, 10 * 60 * 1000);

        setTimers((prev) => ({
          ...prev,
          [vehicle.id]: [t1, t2, t3],
        }));
      }, 3000);

      setTimers((prev) => ({
        ...prev,
        [vehicle.id]: [t1, t2],
      }));
    }, 2500);

    setTimers((prev) => ({
      ...prev,
      [vehicle.id]: [t1],
    }));
  };

  const handleCancelPing = (vehicleId: string) => {
    if (timers[vehicleId]) {
      timers[vehicleId].forEach((t) => clearTimeout(t));
    }
    setVehicleStatuses((prev) => ({
      ...prev,
      [vehicleId]: 'idle',
    }));
    if (activePingVehicleId === vehicleId) {
      setActivePingVehicleId(null);
    }
    try {
      localStorage.removeItem('flowjeep_active_ping');
    } catch {}
    window.dispatchEvent(
      new CustomEvent('flowjeep:passenger_ping', {
        detail: { vehicleId, status: 'idle', timestamp: Date.now() },
      })
    );
  };

  // Sort matched vehicles strictly by proximity to pickupCoords ascending (nearest first)
  const sortedVehicles = [...matchingVehicles].sort((a, b) => {
    if (pickupCoords) {
      const distA =
        Math.hypot(a.vehicle.currentCoord[0] - pickupCoords.lat, a.vehicle.currentCoord[1] - pickupCoords.lng);
      const distB =
        Math.hypot(b.vehicle.currentCoord[0] - pickupCoords.lat, b.vehicle.currentCoord[1] - pickupCoords.lng);
      return distA - distB;
    }
    return a.distanceToPickupKm - b.distanceToPickupKm;
  });

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* 1. Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 shrink-0 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="p-1.5 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <Radio className="w-4 h-4 text-[#800020] animate-pulse" />
              <h1 className="text-[16px] font-extrabold text-slate-900 tracking-tight leading-tight">
                Wait for a Jeep
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[210px] sm:max-w-xs">
              {pickupStopName ? `Pickup: ${pickupStopName}` : 'Live Approaching PUVs'}
            </p>
          </div>
        </div>

        {/* Live Active Units Count Badge */}
        {sortedVehicles.length > 0 && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#00B14F]/10 border border-[#00B14F]/25 text-[#007A37] text-[11px] font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#00B14F] animate-pulse" />
            <span>{sortedVehicles.length} Approaching</span>
          </div>
        )}
      </header>

      {/* 2. Scrollable Body Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3">
        {/* If matching vehicles exist: render sorted card list */}
        {sortedVehicles.length > 0 ? (
          <>
            {/* Context bar with pickup & destination */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#0288D1]" />
                  <span>Waiting at Your Pickup Point</span>
                </div>
                <p className="text-[13px] font-bold text-slate-900 truncate mt-0.5">
                  {pickupStopName || 'Active Station'}
                </p>
                {destinationName && (
                  <p className="text-[11px] text-slate-500 truncate">
                    Towards: <span className="font-semibold text-[#800020]">{destinationName}</span>
                  </p>
                )}
              </div>
              {onSearchTrip && (
                <button
                  type="button"
                  onClick={onSearchTrip}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Edit Trip
                </button>
              )}
            </div>

            {/* Live Vehicle Cards */}
            <div className="space-y-3">
              {sortedVehicles.map((item) => {
                const { vehicle, route, etaMinutes, distanceToPickupKm } = item;
                const status = vehicleStatuses[vehicle.id] || 'idle';
                const isFull = vehicle.occupiedSeats >= vehicle.totalSeats;
                const occupancyRate = vehicle.occupiedSeats / vehicle.totalSeats;
                const isNearFull = occupancyRate >= 0.8 && !isFull;
                const remainingSeats = Math.max(0, vehicle.totalSeats - vehicle.occupiedSeats);
                const { stop, sector } = getVehicleSectorAndStop(vehicle.currentCoord, route.name);

                return (
                  <div
                    key={vehicle.id}
                    className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all ${
                      status !== 'idle'
                        ? 'border-[#800020] ring-1 ring-[#800020]/20'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Plate Number, Route Code & Status Pill */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#800020] text-white flex flex-col items-center justify-center font-black shadow-xs shrink-0">
                          <span className="text-[11px] leading-none">
                            {vehicle.routeCode.replace('Route ', 'R-')}
                          </span>
                          <span className="text-[8px] font-semibold text-rose-200 uppercase mt-0.5">
                            PUV
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                              {vehicle.plateNumber}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              • {vehicle.routeCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[170px] sm:max-w-xs">
                            {route.name}
                          </p>
                        </div>
                      </div>

                      {/* Status Pill */}
                      {isFull ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#800020] border border-red-200">
                          Full / Standing
                        </span>
                      ) : isNearFull ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Near Full
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00B14F]/10 text-[#007A37] border border-[#00B14F]/25">
                          Seats Available
                        </span>
                      )}
                    </div>

                    {/* Passenger Occupancy Bar & Count */}
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11.5px] mb-1.5">
                        <span className="font-semibold text-slate-700">
                          Occupancy: {vehicle.occupiedSeats}/{vehicle.totalSeats} seats
                        </span>
                        <span
                          className={`font-bold ${
                            isFull
                              ? 'text-[#800020]'
                              : isNearFull
                              ? 'text-amber-700'
                              : 'text-[#007A37]'
                          }`}
                        >
                          {isFull
                            ? 'No seats remaining'
                            : `${remainingSeats} ${remainingSeats === 1 ? 'seat' : 'seats'} left`}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull
                              ? 'bg-[#800020]'
                              : isNearFull
                              ? 'bg-amber-500'
                              : 'bg-[#00B14F]'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(10, Math.round(occupancyRate * 100)))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Two-Column Row: Current Position & Corridor Sector */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                          Current Position
                        </span>
                        <span className="font-bold text-slate-800 truncate block mt-0.5">
                          {stop}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                          Corridor Sector
                        </span>
                        <span className="font-bold text-slate-800 truncate block mt-0.5">
                          {sector}
                        </span>
                      </div>
                    </div>

                    {/* Live Telemetry: Speed, Heading & Proximity */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/70 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00B14F] animate-pulse" />
                        <span className="font-bold text-slate-700">GPS Live</span>
                        <span>•</span>
                        <span>{vehicle.speedKmh} km/h</span>
                        <span>•</span>
                        <Compass className="w-3 h-3 text-slate-400 inline" />
                        <span>{vehicle.headingDegrees}°</span>
                      </div>
                      <div className="font-bold text-slate-700">
                        {distanceToPickupKm} km away • ETA ~{etaMinutes}m
                      </div>
                    </div>

                    {/* Action Row: Primary "I'm Waiting" Button & Secondary "View on Map" Link */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      {/* Secondary action: View on Map */}
                      <button
                        type="button"
                        onClick={() => onViewOnMap(vehicle)}
                        className="text-[12px] font-bold text-slate-600 hover:text-[#800020] flex items-center space-x-1 transition-colors cursor-pointer py-1.5 px-1 shrink-0"
                      >
                        <span>View on map</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {/* Primary Ping Action Button */}
                      <div className="flex-1 max-w-[200px] flex items-center justify-end">
                        {isFull ? (
                          <div className="w-full text-right" title="Vehicle at maximum capacity. Cannot board.">
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold cursor-not-allowed opacity-75"
                            >
                              Jeep is Full
                            </button>
                            <span className="block text-[9.5px] text-[#800020] mt-0.5 font-medium">
                              Full · Standing room only
                            </span>
                          </div>
                        ) : status === 'idle' || status === 'expired' ? (
                          <button
                            type="button"
                            onClick={() => handleStartPing(item)}
                            className="w-full py-2 px-3.5 rounded-xl bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold shadow-md shadow-[#800020]/20 flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer"
                          >
                            <Radio className="w-3.5 h-3.5 text-white" />
                            <span>I'm Waiting</span>
                          </button>
                        ) : status === 'waiting' ? (
                          <div className="w-full flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled
                              className="flex-1 py-2 px-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center space-x-1 cursor-default"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              <span>Waiting…</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelPing(vehicle.id)}
                              title="Cancel wait ping"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : status === 'acknowledged' ? (
                          <div className="w-full flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled
                              className="flex-1 py-2 px-2 rounded-xl bg-[#00B14F]/10 border border-[#00B14F]/25 text-[#007A37] text-xs font-bold flex items-center justify-center space-x-1 cursor-default"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00B14F]" />
                              <span>Jeep Notified</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelPing(vehicle.id)}
                              title="Cancel wait ping"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : status === 'arriving' ? (
                          <div className="w-full flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled
                              className="flex-1 py-2 px-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center justify-center space-x-1 cursor-default animate-pulse"
                            >
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              <span>Arriving · ETA {etaMinutes}m</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelPing(vehicle.id)}
                              title="Cancel wait ping"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Step 4: Empty state when matchingVehicles.length === 0 -> Render Corridor Browser */
          <div className="space-y-3.5">
            {/* Guide Banner */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#800020] flex items-center justify-center shrink-0 mt-0.5">
                  <Radio className="w-5 h-5 text-[#800020]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                    {pickupCoords && !destinationCoords
                      ? 'Set a destination to see matching jeeps'
                      : 'No live-matched jeepneys yet'}
                  </h3>
                  <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                    {pickupCoords && !destinationCoords
                      ? 'Select your destination stop on the map or search below to filter modern jeepneys serving your complete route.'
                      : 'Matching jeepneys appear here once you set both a pickup and destination point. In the meantime, browse the active modern jeepney corridors below.'}
                  </p>
                  {onSearchTrip && (
                    <button
                      type="button"
                      onClick={onSearchTrip}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-[#800020] text-white text-xs font-bold shadow-xs hover:bg-[#600018] transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Set Pickup & Destination</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preserved Corridor Browser (relocated from former Routes tab) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">
                  Modern Jeepney Corridors
                </h2>
                <span className="text-[11px] font-medium text-slate-400">
                  {LOCAL_VECTOR_CORRIDORS.length} Transit Routes
                </span>
              </div>

              <div className="space-y-2.5">
                {LOCAL_VECTOR_CORRIDORS.map((corridor) => (
                  <div
                    key={corridor.id}
                    onClick={() => onSelectCorridor(corridor)}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-[#800020]/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-[#800020] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        Corridor #{corridor.id.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {corridor.coords.length} Transit Stops
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <h3 className="text-[13.5px] font-bold text-slate-900 group-hover:text-[#800020] transition-colors">
                        {corridor.name}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#800020] transition-colors" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tap to pan map to this corridor and view approaching jeepneys.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom padding for tab bar */}
        <div className="h-6" />
      </main>

      {/* Confirmation Dialog: Switching Active Ping */}
      {pendingSwitchVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-[#800020] mb-2">
              <AlertTriangle className="w-5 h-5 text-[#800020]" />
              <h3 className="text-[14px] font-bold text-slate-900">
                Switch Waiting Jeep?
              </h3>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              You already have an active ping waiting for another modern jeepney. Would you like to cancel that ping and wait for{' '}
              <strong className="text-slate-900">
                {pendingSwitchVehicle.vehicle.plateNumber} ({pendingSwitchVehicle.vehicle.routeCode})
              </strong>{' '}
              instead?
            </p>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPendingSwitchVehicle(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = pendingSwitchVehicle;
                  setPendingSwitchVehicle(null);
                  executePing(target);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#800020] text-white text-xs font-bold shadow-xs hover:bg-[#600018] transition-colors cursor-pointer"
              >
                Switch to This Jeep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
