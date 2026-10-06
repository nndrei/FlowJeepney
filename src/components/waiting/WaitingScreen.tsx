import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Radio,
  MapPin,
  Clock,
  Users,
  Bell,
  CheckCircle2,
  Navigation,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ModernJeepneyVehicle,
  filterVehiclesForJourney,
} from '../../utils/jeepneyCorridors';
import { submitWaitingPing, cancelWaitingPing } from '../../services/databaseService';

interface WaitingScreenProps {
  pickupCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  pickupStopName: string;
  destinationName: string;
  onOpenMenu: () => void;
  onBackToHome?: () => void;
  onChangeStop?: () => void;
  onTrackOnMap: (coord: [number, number]) => void;
  activeFleet?: ModernJeepneyVehicle[];
  userCoords?: { lat: number; lng: number } | null;
  onRequestGps?: () => void;
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  pickupCoords,
  destinationCoords,
  pickupStopName,
  destinationName,
  onOpenMenu,
  onBackToHome,
  onChangeStop,
  onTrackOnMap,
  activeFleet = [],
  userCoords,
  onRequestGps,
}) => {
  // Track which vehicles the passenger has signaled/notified
  const [signaledVehicleIds, setSignaledVehicleIds] = useState<Set<string>>(new Set());
  const [lastSignaledPlate, setLastSignaledPlate] = useState<string | null>(null);
  const activePingIdRef = useRef<string | null>(null);

  const effectivePickup = pickupCoords || userCoords;

  // Publish waiting commuter ping to Firebase RTDB while broadcasting on this screen
  useEffect(() => {
    if (effectivePickup) {
      let isMounted = true;
      let rawUser: string | null = null;
      try {
        rawUser = localStorage.getItem('flowjeep_user');
      } catch {
        // ignore
      }
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;

      submitWaitingPing({
        userId: parsedUser?.uid || 'guest',
        isGuest: !parsedUser || !!parsedUser.isGuest,
        routeId: 'route-1',
        pickupCoords: {
          lat: effectivePickup.lat,
          lng: effectivePickup.lng,
        },
        destinationCoords: destinationCoords
          ? { lat: destinationCoords.lat, lng: destinationCoords.lng }
          : undefined,
        pickupStopName: pickupStopName || 'Current Location',
        destinationName: destinationName || undefined,
        status: 'waiting',
      })
        .then((pingId) => {
          if (isMounted) {
            activePingIdRef.current = pingId;
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
        if (activePingIdRef.current) {
          cancelWaitingPing(activePingIdRef.current).catch(() => {});
          activePingIdRef.current = null;
        }
      };
    }
  }, [
    effectivePickup?.lat,
    effectivePickup?.lng,
    destinationCoords?.lat,
    destinationCoords?.lng,
    pickupStopName,
    destinationName,
  ]);

  // Filter vehicles covering the journey, or fall back to active fleet units from Firebase
  const journeyUnits = effectivePickup
    ? filterVehiclesForJourney(effectivePickup, destinationCoords, activeFleet)
    : [];

  const matchingUnits = journeyUnits.length > 0
    ? journeyUnits
    : activeFleet.map((v) => {
        let distKm = 0.8;
        if (effectivePickup && v.currentCoord) {
          const latDist = (v.currentCoord[0] - effectivePickup.lat) * 111.32;
          const lngDist = (v.currentCoord[1] - effectivePickup.lng) * 111.32 * Math.cos((effectivePickup.lat * Math.PI) / 180);
          distKm = Math.sqrt(latDist * latDist + lngDist * lngDist);
        }
        const eta = Math.max(1, Math.round((distKm / 22) * 60));
        return {
          vehicle: v,
          route: { id: v.routeId, name: v.routeName, routeCode: v.routeCode, origin: '', destination: '', fareBase: 15, path: [] },
          etaMinutes: eta,
          distanceToPickupKm: parseFloat(distKm.toFixed(1)),
        };
      });

  const handleToggleSignal = (vehicleId: string, plateNumber: string) => {
    setSignaledVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) {
        next.delete(vehicleId);
        if (lastSignaledPlate === plateNumber) {
          setLastSignaledPlate(null);
        }
      } else {
        next.add(vehicleId);
        setLastSignaledPlate(plateNumber);
      }
      return next;
    });
  };

  return (
    <div className="relative z-20 flex-1 w-full overflow-hidden flex flex-col bg-slate-100">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 shrink-0 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="p-1.5 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-[16px] font-extrabold text-slate-900 leading-tight">
              I Am Waiting
            </h1>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold bg-slate-900 text-[#00E676] shadow-2xs leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
              <span>Broadcasting</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {/* Signal Confirmation Toast */}
        {lastSignaledPlate && (
          <div className="bg-[#002E14] text-white p-3 rounded-2xl shadow-md border border-[#00B14F]/40 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#00B14F]/20 border border-[#00B14F]/35 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
              </div>
              <div className="text-left">
                <div className="text-[12.5px] font-bold leading-tight text-white">
                  Driver Signaled · {lastSignaledPlate}
                </div>
                <div className="text-[10.5px] text-[#A3F3C6] font-medium">
                  Driver's tablet manifest updated with your waiting stop.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastSignaledPlate(null)}
              className="text-xs text-[#00E676] hover:text-white underline font-semibold cursor-pointer pl-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Route & Stop Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.05)] p-4 space-y-3.5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#800020] animate-pulse" />
            <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
              Current Waiting Corridor
            </span>
          </div>

          {/* Pickup & Destination Flow */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2.5">
              <div className="w-6 h-6 rounded-full bg-[#0288D1] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Waiting At (Pickup)
                </span>
                <p className="text-[13px] font-bold text-slate-900 truncate">
                  {pickupStopName || (userCoords ? 'Near GPS Location' : 'Tap to set pickup stop')}
                </p>
              </div>
            </div>

            <div className="ml-3 pl-3 border-l-2 border-dashed border-slate-200 py-0.5" />

            <div className="flex items-start space-x-2.5">
              <div className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Navigation className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Drop-off Destination
                </span>
                <p className="text-[13px] font-bold text-slate-900 truncate">
                  {destinationName || 'Any stop along transit route'}
                </p>
              </div>
            </div>
          </div>

          {/* Premium Metric Cards: Dark Charcoal Standard Fare + Crisp White Secondary */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-xs flex flex-col justify-center">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Standard Fare
              </span>
              <span className="text-[16px] font-black text-amber-400 leading-tight">
                ₱15.00
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 text-slate-900 rounded-2xl p-3 flex flex-col justify-center shadow-xs">
              <div className="flex items-center space-x-1 text-slate-400 mb-0.5">
                <Radio className="w-3 h-3 text-[#0288D1]" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider block">
                  En Route
                </span>
              </div>
              <span className="text-[16px] font-black text-slate-900 leading-tight">
                {matchingUnits.length} {matchingUnits.length === 1 ? 'Jeep' : 'Jeeps'}
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 text-slate-900 rounded-2xl p-3 flex flex-col justify-center shadow-xs">
              <div className="flex items-center space-x-1 text-slate-400 mb-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-[9.5px] font-bold uppercase tracking-wider block">
                  Interval
                </span>
              </div>
              <span className="text-[16px] font-black text-slate-900 leading-tight">
                ~5 min
              </span>
            </div>
          </div>
        </div>

        {/* Live Incoming Feed Section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center space-x-1.5">
              <h2 className="text-[13.5px] font-black text-slate-800 tracking-tight">
                Approaching Modern Jeepneys
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-900/[0.05] border border-slate-900/[0.08] text-slate-700 text-[10px] font-bold">
                {matchingUnits.length}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Live GPS Telemetry</span>
          </div>

          {matchingUnits.length > 0 ? (
            <div className="space-y-3">
              {matchingUnits.map(({ vehicle, route, etaMinutes, distanceToPickupKm }) => {
                const isSignaled = signaledVehicleIds.has(vehicle.id);
                const availableSeats = Math.max(0, vehicle.totalSeats - vehicle.occupiedSeats);
                const isFull = availableSeats === 0;
                const distanceText =
                  distanceToPickupKm < 1
                    ? `${Math.round(distanceToPickupKm * 1000)}m away`
                    : `${distanceToPickupKm.toFixed(1)}km away`;

                return (
                  <div
                    key={vehicle.id}
                    className={`bg-white border rounded-3xl p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all ${
                      isSignaled
                        ? 'border-[#00B14F] ring-2 ring-[#00B14F]/20'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Route Badge + Plate + ETA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-11 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                          <span className="text-[13px] font-black leading-none">
                            {vehicle.routeCode.startsWith('Route ')
                              ? `R-${vehicle.routeCode.replace('Route ', '').padStart(2, '0')}`
                              : vehicle.routeCode}
                          </span>
                          <span className="text-[8px] font-bold text-slate-300 uppercase mt-0.5 tracking-tight truncate max-w-[42px]">
                            {vehicle.plateNumber}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-[13.5px] font-bold text-slate-900 leading-tight">
                            {vehicle.routeName}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {route?.name || vehicle.routeName}
                          </p>
                        </div>
                      </div>

                      {/* Right ETA */}
                      <div className="text-right shrink-0 pl-2">
                        <div className="text-[18px] font-black text-[#800020] leading-none">
                          {etaMinutes} min
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-medium mt-1">
                          {distanceText}
                        </div>
                      </div>
                    </div>

                    {/* Passenger Load Bar & Capacity Breakdown */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-2 flex-1 mr-3">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull
                                ? 'bg-[#800020]'
                                : availableSeats <= 4
                                ? 'bg-amber-500'
                                : 'bg-[#00B14F]'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((vehicle.occupiedSeats / vehicle.totalSeats) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 whitespace-nowrap">
                          {vehicle.occupiedSeats}/{vehicle.totalSeats} aboard
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap shadow-2xs ${
                          isFull
                            ? 'bg-rose-50 text-rose-800 border border-rose-200/80'
                            : availableSeats <= 4
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-[#00B14F]/10 text-[#007A37] border border-[#00B14F]/25'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isFull
                              ? 'bg-rose-500'
                              : availableSeats <= 4
                              ? 'bg-amber-500'
                              : 'bg-[#00B14F]'
                          }`}
                        />
                        <span>{isFull ? 'Standing Only' : `${availableSeats} Seats Left`}</span>
                      </span>
                    </div>

                    {/* Action Buttons: Signal Driver & Track */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSignal(vehicle.id, vehicle.plateNumber)}
                        className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl text-[12px] font-bold transition-all cursor-pointer shadow-sm ${
                          isSignaled
                            ? 'bg-[#00B14F] hover:bg-[#009643] text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isSignaled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>Driver Signaled ✓</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-rose-300" />
                            <span>Signal Driver</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onTrackOnMap(vehicle.currentCoord)}
                        className="flex items-center space-x-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-2xl text-[12px] font-bold transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                        title="Focus vehicle on live map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>Track on Map</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#800020] text-white flex items-center justify-center mx-auto shadow-sm">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">
                  No jeepneys currently on this segment
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 max-w-[280px] mx-auto">
                  {destinationCoords
                    ? 'No active modern units are currently transmitting GPS along both your selected pickup and destination corridor.'
                    : 'Choose your pickup stop to track incoming fleet units along your route.'}
                </p>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-700 flex items-center justify-between shadow-2xs">
                <span className="flex items-center space-x-1.5 font-semibold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-[#800020]" />
                  <span>Next Terminal Dispatch</span>
                </span>
                <span className="font-semibold text-slate-500">Awaiting live dispatch</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
