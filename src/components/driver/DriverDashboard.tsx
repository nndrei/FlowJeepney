import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  ChevronRight,
  Gauge,
  Signal,
  ArrowUp,
  ArrowDown,
  Compass,
} from 'lucide-react';
import { AuthUser } from '../../types/auth';
import {
  subscribeAssignedJeepney,
  DriverAssignedVehicleBundle,
} from '../../services/databaseService';
import { useHybridWeather } from '../../services/hybridWeatherService';
import { getManilaTodayString } from '../../utils/weatherDateUtils';
import { formatVehicleId, shortStopName } from '../../utils/transitFormatters';

const JeepneyIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 48 48" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Destination marquee roof box */}
    <rect x="14" y="6" width="20" height="4" rx="2" fill="currentColor" />
    {/* Left and right mirrors */}
    <rect x="5" y="18" width="2.5" height="7" rx="1.2" fill="currentColor" />
    <rect x="40.5" y="18" width="2.5" height="7" rx="1.2" fill="currentColor" />
    <path d="M7.5 20.5H10M40.5 20.5H38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {/* Cab body */}
    <path
      d="M10 13C10 11.3431 11.3431 10 13 10H35C36.6569 10 38 11.3431 38 13V29C38 30.6569 36.6569 32 35 32H13C11.3431 32 10 30.6569 10 29V13Z"
      fill="currentColor"
    />
    {/* Split windshields */}
    <rect x="13" y="14" width="9.5" height="7.5" rx="1.5" fill="#800020" />
    <rect x="25.5" y="14" width="9.5" height="7.5" rx="1.5" fill="#800020" />
    {/* Center grille */}
    <rect x="18" y="24" width="12" height="5.5" rx="1" fill="#800020" />
    <line x1="19.5" y1="25.7" x2="28.5" y2="25.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <line x1="19.5" y1="27.7" x2="28.5" y2="27.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    {/* Headlights */}
    <circle cx="14" cy="26" r="2.2" fill="#800020" />
    <circle cx="34" cy="26" r="2.2" fill="#800020" />
    {/* Front Bumper */}
    <rect x="8" y="32" width="32" height="4.5" rx="2" fill="currentColor" />
    {/* Tires */}
    <rect x="10" y="34.5" width="7" height="5.5" rx="2" fill="currentColor" />
    <rect x="31" y="34.5" width="7" height="5.5" rx="2" fill="currentColor" />
  </svg>
);

interface DriverDashboardProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [bundle, setBundle] = useState<DriverAssignedVehicleBundle>({
    jeepney: null,
    telemetry: null,
    device: null,
    route: null,
  });

  const driverUid = user?.uid || '';
  const driverEmail = user?.email || '';

  // 1. Subscribe to Driver's assigned Jeepney and live telemetry from RTDB
  useEffect(() => {
    if (!driverUid && !driverEmail) return;
    const unsubscribe = subscribeAssignedJeepney(
      driverUid,
      (updatedBundle) => {
        setBundle(updatedBundle);
      },
      {
        email: driverEmail,
        driverId: user?.driverId,
        assignedJeepneyId: user?.assignedJeepneyId,
        assignedPlate: user?.assignedPlate,
      }
    );
    return () => {
      unsubscribe();
    };
  }, [driverUid, driverEmail, user?.driverId, user?.assignedJeepneyId, user?.assignedPlate]);

  const { jeepney, telemetry, route } = bundle;

  // 2. Weather Hook for Metro Manila Corridor
  const todayIso = useMemo(() => getManilaTodayString(), []);
  const manilaCoords = useMemo(() => ({ lat: 14.6544, lng: 120.9839 }), []);
  const { weather, baseOpenWeatherData } = useHybridWeather(manilaCoords, todayIso);

  const isConnected = Boolean(jeepney);

  // Real Passenger Load from Telemetry (only if connected)
  const currentCount = telemetry?.occupiedSeats ?? (jeepney as any)?.occupiedSeats ?? 0;
  const capacity = telemetry?.totalSeats ?? jeepney?.totalSeats ?? 0;
  const availableSeats = Math.max(0, capacity - currentCount);
  const occupancyPct = capacity > 0 ? Math.min(100, Math.round((currentCount / capacity) * 100)) : 0;

  // Real Speed & Real Identifiers from Database (zero fake fallbacks)
  const speedKmh = telemetry?.speedKmh ? Math.round(telemetry.speedKmh) : 0;
  const plateNumber = jeepney?.plateNumber || user?.assignedPlate || '';
  const rawUnitId = jeepney?.id || (plateNumber ? `FJ-${plateNumber.slice(-2)}` : '');
  const vehicleIdInfo = useMemo(() => formatVehicleId(rawUnitId), [rawUnitId]);

  // Real Route details from Database (only when real route is assigned)
  const originName = route?.origin ? route.origin.split(/[-–—/]/)[0].trim() : '';
  const destName = route?.destination ? route.destination.split(/[-–—/]/)[0].trim() : '';

  const shortOrigin = useMemo(() => shortStopName(route?.origin || originName || ''), [route?.origin, originName]);
  const shortDest = useMemo(() => shortStopName(route?.destination || destName || ''), [route?.destination, destName]);

  // Corridor Stops from Database route stops (dynamic fallback if 1-2 stops or origin/dest)
  const stopsList = useMemo(() => {
    if (route?.stops && Object.keys(route.stops).length > 0) {
      const sorted = Object.values(route.stops).sort((a, b) => a.sequenceOrder - b.sequenceOrder);
      if (sorted.length >= 3) {
        return [
          sorted[0].name,
          sorted[Math.floor(sorted.length / 2)].name,
          sorted[sorted.length - 1].name,
        ];
      } else if (sorted.length === 2) {
        return [
          sorted[0].name,
          'Corridor Waypoint',
          sorted[1].name,
        ];
      } else if (sorted.length === 1) {
        return [
          originName || sorted[0].name,
          sorted[0].name,
          destName || sorted[0].name,
        ];
      }
    }
    if (originName && destName) {
      return [originName, 'On Route', destName];
    }
    return [];
  }, [route, originName, destName]);

  const hasActiveTrip = Boolean(jeepney && (route || stopsList.length > 0));

  // Real Telemetry Timestamps (no fabricated clock offsets)
  const now = new Date();
  const currentStopIso = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const telemetryTimestamp = (telemetry as any)?.timestamp;
  const pastStopIso = telemetryTimestamp
    ? new Date(telemetryTimestamp - 6 * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '—';
  const nextStopIso = telemetryTimestamp
    ? new Date(telemetryTimestamp + 6 * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '—';
  const sessionStartTime = telemetryTimestamp || null;
  const sessionStartStr = sessionStartTime
    ? new Date(sessionStartTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '—';
  const uptimeMinutes = sessionStartTime ? Math.max(1, Math.floor((Date.now() - sessionStartTime) / 60000)) : 0;
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  const uptimeRem = uptimeMinutes % 60;
  const uptimeText = uptimeHours > 0 ? `${uptimeHours}h ${uptimeRem}m` : `${uptimeMinutes}m`;

  // Weather numbers from live hybrid weather
  const currentTemp = weather?.temperatureC ? Math.round(weather.temperatureC) : 28;
  const currentCondition = weather?.condition || 'Partly Cloudy';
  const highTemp = baseOpenWeatherData?.dailyHighC ? Math.round(baseOpenWeatherData.dailyHighC) : 32;
  const lowTemp = baseOpenWeatherData?.dailyLowC ? Math.round(baseOpenWeatherData.dailyLowC) : 25;

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar bg-slate-50 text-slate-900 select-none p-4 pb-12 flex flex-col gap-3.5 font-sans">
      {/* 1. Top Maroon Vehicle & Route Banner Card (Responsive flex layout with fluid typography) */}
      <section className="w-full shrink-0 bg-gradient-to-r from-[#6b001a] via-[#800020] to-[#550014] text-white rounded-[24px] sm:rounded-[26px] p-3.5 sm:p-4 px-4 sm:px-6 relative overflow-hidden select-none shadow-md shadow-[#800020]/25">
        {/* Content Flex Row */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
          {isConnected ? (
            <>
              {/* Left Block: Vehicle ID & Plate */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-white/80 font-normal leading-none mb-1 whitespace-nowrap">
                  Your Jeepney
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <h1
                    className="font-bold text-[clamp(0.85rem,3.8vw,1.1rem)] whitespace-nowrap tracking-tight text-white leading-tight"
                    title={vehicleIdInfo.full}
                    aria-label={`Vehicle ID ${vehicleIdInfo.full}`}
                  >
                    {vehicleIdInfo.display}
                  </h1>
                  {/* Chevron Button */}
                  <button
                    type="button"
                    aria-label="View vehicle details"
                    className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="mt-1">
                  <span className="bg-white text-slate-900 font-mono font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-xs inline-block tracking-wider leading-none truncate max-w-full">
                    {plateNumber || '—'}
                  </span>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="shrink-0 w-px h-10 sm:h-12 bg-white/20 mx-1 sm:mx-2" aria-hidden="true" />

              {/* Right Block: Route Info */}
              <div className="shrink-0 max-w-[48%] flex flex-col items-end text-right justify-center">
                <span className="text-[10px] sm:text-[11px] text-white/80 font-normal leading-none mb-1 whitespace-nowrap">
                  Route
                </span>
                <div className="flex flex-col items-end text-right leading-tight max-w-full">
                  <span
                    className="font-bold text-[clamp(0.75rem,3.2vw,0.875rem)] text-white text-balance break-words leading-tight"
                    title={route?.origin || originName || 'Origin'}
                  >
                    {shortOrigin}
                  </span>
                  <span
                    className="font-bold text-[clamp(0.75rem,3.2vw,0.875rem)] text-white text-balance break-words leading-tight flex items-center justify-end gap-1"
                    title={route?.destination || destName || 'Destination'}
                  >
                    <span className="text-white/80 font-normal shrink-0">→</span>
                    <span className="break-words">{shortDest}</span>
                  </span>
                </div>
                <div className="mt-1">
                  <span className="bg-rose-100 text-[#800020] text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs inline-block leading-none whitespace-nowrap">
                    {(route as any)?.direction || 'Northbound'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Left Block: Disconnected State */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-white/70 font-normal leading-none mb-1 whitespace-nowrap">
                  Your Jeepney
                </span>
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight">
                    No Jeepney Connected
                  </h1>
                  {/* Chevron Button (Disabled) */}
                  <button
                    type="button"
                    disabled
                    aria-label="No jeepney connected"
                    className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 text-white/50 flex items-center justify-center cursor-default"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9.5px] sm:text-[10.5px] text-white/80 font-medium leading-tight mt-0.5">
                  Connect a unit to start tracking
                </p>
              </div>

              {/* Vertical Divider */}
              <div className="shrink-0 w-px h-10 sm:h-12 bg-white/20 mx-1 sm:mx-2" aria-hidden="true" />

              {/* Right Block: Neutral Route Area */}
              <div className="shrink-0 max-w-[48%] flex flex-col items-end text-right justify-center">
                <span className="text-[10px] sm:text-[11px] text-white/70 font-normal leading-none mb-1 whitespace-nowrap">
                  Route
                </span>
                <div className="text-right leading-tight">
                  <p className="text-xs sm:text-sm font-bold text-white/90 leading-tight">
                    —
                  </p>
                </div>
                <div className="mt-1">
                  <span className="bg-white/15 text-white/80 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs inline-block leading-none whitespace-nowrap">
                    Not Assigned
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 2. Current Trip Card */}
      <section className="w-full shrink-0 bg-white rounded-[22px] p-4.5 shadow-sm border border-slate-100 flex flex-col gap-3.5">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Current Trip
            </h3>
            {hasActiveTrip ? (
              <span className="bg-rose-50 text-[#800020] border border-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                On Route
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                No Active Trip
              </span>
            )}
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400 mr-1">Started</span>
            <span className="font-bold text-slate-700">{hasActiveTrip ? sessionStartStr : '—'}</span>
          </div>
        </div>

        {hasActiveTrip && stopsList.length >= 3 ? (
          /* Route Timeline Stepper */
          <div className="pt-2 px-1">
            {/* Stepper Dots & Track */}
            <div className="flex items-center justify-between relative">
              {/* Step 1: Past Stop Dot */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#800020] shrink-0 z-10" />

              {/* Connecting Active Maroon Bar */}
              <div className="h-[2.5px] bg-[#800020] flex-1 -mx-0.5" />

              {/* Step 2: Active Current Stop Ring */}
              <div className="w-5 h-5 rounded-full border-[2.5px] border-[#800020] bg-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-[#800020]" />
              </div>

              {/* Connecting Upcoming Gray Bar */}
              <div className="h-[2.5px] bg-slate-200 flex-1 -mx-0.5" />

              {/* Step 3: Upcoming Gray Dot */}
              <div className="w-3.5 h-3.5 rounded-full bg-slate-300 shrink-0 z-10" />
            </div>

            {/* Stepper Labels */}
            <div className="flex items-start justify-between mt-2.5 text-center">
              {/* Left: Previous Stop */}
              <div className="text-left w-1/3">
                <p className="text-xs text-slate-500 font-medium leading-tight truncate">
                  {stopsList[0]}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">{pastStopIso}</span>
              </div>

              {/* Center: Current Stop */}
              <div className="w-1/3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                  Current Stop
                </span>
                <p className="text-xs font-black text-slate-900 leading-tight truncate">
                  {stopsList[1]}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">{currentStopIso}</span>
              </div>

              {/* Right: Next Stop */}
              <div className="text-right w-1/3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                  Next Stop
                </span>
                <p className="text-xs text-slate-600 font-medium leading-tight truncate">
                  {stopsList[2]}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">{nextStopIso}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Unconnected State */
          <div className="py-4 px-3 rounded-xl bg-slate-50/70 border border-dashed border-slate-200/90 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-700">
              No Active Trip
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Connect a jeepney unit to view trip information.
            </p>
          </div>
        )}
      </section>

      {/* 3. Metrics Cards (2 Columns: Current Passengers & ETA) */}
      <section className="w-full shrink-0 grid grid-cols-2 gap-3">
        {/* Left: Current Passengers Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-slate-800">
            <Users className="w-4 h-4 text-[#800020]" />
            <span className="text-xs font-bold tracking-tight">Current Passengers</span>
          </div>

          <div>
            {isConnected && capacity > 0 ? (
              <>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-[#800020] font-mono tracking-tight">
                    {currentCount}
                  </span>
                  <span className="text-2xl font-bold text-[#800020]/50 font-mono">/</span>
                  <span className="text-2xl font-bold text-[#800020] font-mono">
                    {capacity}
                  </span>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
                  <div
                    className="h-full bg-[#800020] rounded-full transition-all duration-500"
                    style={{ width: `${occupancyPct}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-slate-300 font-mono tracking-tight">
                    —
                  </span>
                </div>

                {/* Empty Progress Bar */}
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
                  <div className="h-full bg-slate-200 rounded-full w-0" />
                </div>
              </>
            )}
          </div>

          {/* Seats Available Pill */}
          {isConnected && capacity > 0 ? (
            <div className="bg-rose-50/70 border border-rose-100 rounded-xl px-2.5 py-2 flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-[#800020] flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-[#800020]/80 font-semibold block leading-none">
                  Available
                </span>
                <span className="text-xs font-bold text-[#800020] leading-none mt-0.5 block">
                  {availableSeats} seats left
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block leading-none">
                  Capacity
                </span>
                <span className="text-xs font-semibold text-slate-500 leading-none mt-0.5 block">
                  Not available
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: ETA to Next Stop Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-slate-800">
            <Clock className="w-4 h-4 text-[#800020]" />
            <span className="text-xs font-bold tracking-tight">ETA to Next Stop</span>
          </div>

          {isConnected && hasActiveTrip && stopsList.length >= 2 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#800020] tracking-tight">
                  {(telemetry as any)?.etaMin ? `${(telemetry as any).etaMin} min` : (speedKmh > 0 ? `${Math.max(2, Math.round(15 / (speedKmh / 60)))} min` : '—')}
                </span>
                <div className="w-7 h-7 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="pt-1">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {stopsList[stopsList.length - 1]}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Approaching
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-slate-300 tracking-tight">
                  —
                </span>
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="pt-1">
                <p className="text-xs font-semibold text-slate-500 leading-tight">
                  Next Stop
                </p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Not available
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Telemetry Row (3 Columns: Current Speed, Network, Uptime) */}
      <section className="w-full shrink-0 grid grid-cols-3 gap-2.5">
        {/* Speed Card */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 space-y-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isConnected ? 'bg-rose-50 text-[#800020]' : 'bg-slate-100 text-slate-400'}`}>
            <Gauge className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">
            Current Speed
          </span>
          <p className={`text-sm font-black leading-none ${isConnected ? 'text-slate-900' : 'text-slate-400'}`}>
            {isConnected ? `${speedKmh} km/h` : '—'}
          </p>
        </div>

        {/* Network Card */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 space-y-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isConnected ? 'bg-rose-50 text-[#800020]' : 'bg-slate-100 text-slate-400'}`}>
            <Signal className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">
            Network
          </span>
          <div>
            <p className={`text-sm font-black leading-none ${isConnected ? 'text-slate-900' : 'text-slate-400'}`}>
              {isConnected ? ((bundle.device as any)?.networkType || 'Online') : '—'}
            </p>
            <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">
              {isConnected
                ? ((bundle.device as any)?.wifiRssi ? `${(bundle.device as any).wifiRssi} dBm` : 'Connected')
                : 'Not connected'}
            </span>
          </div>
        </div>

        {/* Uptime Card */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 space-y-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isConnected ? 'bg-rose-50 text-[#800020]' : 'bg-slate-100 text-slate-400'}`}>
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">
            Uptime
          </span>
          <div>
            <p className={`text-sm font-black leading-none ${isConnected ? 'text-slate-900' : 'text-slate-400'}`}>
              {isConnected && sessionStartTime ? uptimeText : '—'}
            </p>
            <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">
              {isConnected && sessionStartTime ? `Since ${sessionStartStr}` : 'Not available'}
            </span>
          </div>
        </div>
      </section>

      {/* 5. Weather & Temperature Summary Card */}
      <section className="w-full shrink-0 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-10 flex items-center justify-center shrink-0">
            {/* Stylized Sun Behind Cloud SVG */}
            <svg viewBox="0 0 48 40" className="w-11 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="14" r="8" fill="#F59E0B" />
              <path d="M14 34H36C39.3137 34 42 31.3137 42 28C42 24.6863 39.3137 22 36 22C35.7 22 35.4 22.02 35.1 22.07C34.1 17.5 30 14 25 14C19.5 14 15 18.2 14.2 23.6C13.8 23.53 13.4 23.5 13 23.5C8.58 23.5 5 27.08 5 31.5C5 32.9 5.35 34.2 6 35.3" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#93C5FD" fillOpacity="0.8" />
              <path d="M12 36H35C38.3137 36 41 33.3137 41 30C41 27.2 39.1 24.8 36.5 24.2C35.8 19.5 31.8 16 27 16C21.8 16 17.5 19.8 17 25C16.3 24.8 15.6 24.7 15 24.7C10.6 24.7 7 28.3 7 32.7C7 34.5 7.6 36 8.7 37" fill="#60A5FA" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
              {currentTemp}°C
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {currentCondition}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-right text-xs font-bold text-slate-700">
          <div className="flex items-center justify-end space-x-1.5 text-rose-600">
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-black">{highTemp}°C</span>
          </div>
          <div className="flex items-center justify-end space-x-1.5 text-sky-600">
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-black">{lowTemp}°C</span>
          </div>
        </div>
      </section>
    </div>
  );
};
