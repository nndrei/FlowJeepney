import React, { useState, useEffect } from 'react';
import {
  Users,
  Radio,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Gauge,
  Clock,
  RefreshCw,
  Cpu,
  Car,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AuthUser } from '../../types/auth';
import {
  subscribeAssignedJeepney,
  getRecentDoorwayEventsForJeepney,
  DriverAssignedVehicleBundle,
} from '../../services/databaseService';
import { DoorwayEventRecord } from '../../types/database';

interface DriverDashboardProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user, onLogout }) => {
  const [bundle, setBundle] = useState<DriverAssignedVehicleBundle>({
    jeepney: null,
    telemetry: null,
    device: null,
    route: null,
  });
  const [doorwayEvents, setDoorwayEvents] = useState<DoorwayEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const driverUid = user?.uid || '';

  // Real-time vehicle subscription strictly scoped to driver's assigned vehicle
  useEffect(() => {
    if (!driverUid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeAssignedJeepney(driverUid, (updatedBundle) => {
      setBundle(updatedBundle);
      setIsLoading(false);

      if (updatedBundle.jeepney?.id) {
        getRecentDoorwayEventsForJeepney(updatedBundle.jeepney.id, 6)
          .then(setDoorwayEvents)
          .catch(() => {});
      } else {
        setDoorwayEvents([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [driverUid]);

  const handleManualRefresh = async () => {
    if (!bundle.jeepney?.id) return;
    setIsRefreshing(true);
    try {
      const events = await getRecentDoorwayEventsForJeepney(bundle.jeepney.id, 6);
      setDoorwayEvents(events);
    } finally {
      setIsRefreshing(false);
    }
  };

  const { jeepney, telemetry, device, route } = bundle;

  // Passenger Load Calculations
  const currentCount = telemetry?.currentPassengerCount ?? 0;
  const capacity = jeepney?.capacity ?? 22;
  const occupancyPct = Math.min(100, Math.round((currentCount / capacity) * 100));
  const availableSeats = Math.max(0, capacity - currentCount);

  const getOccupancyStatus = (pct: number) => {
    if (pct >= 95) return { label: 'FULL CAPACITY', color: 'bg-red-500 text-white', badge: 'bg-red-100 text-red-700 border-red-200' };
    if (pct >= 70) return { label: 'STANDING / NEAR FULL', color: 'bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'SEATS AVAILABLE', color: 'bg-emerald-500 text-white', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const occupancyStatus = getOccupancyStatus(occupancyPct);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 text-slate-900 select-none overflow-y-auto no-scrollbar">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[13px] font-bold text-slate-900 tracking-tight">FlowJeep</span>
              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-wider">
                Driver
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
              {user?.displayName || user?.name || user?.email || 'Authorized Driver'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer"
          title="Sign out from driver portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-3.5 pb-8 flex-1">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Connecting to assigned vehicle stream...</p>
          </div>
        ) : !jeepney ? (
          /* Unassigned Driver State */
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">No Vehicle Assigned</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                Your driver account is registered, but has not yet been assigned to an active jeepney unit.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Name:</span>
                <span className="font-semibold">{user?.displayName || user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Email:</span>
                <span className="font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">License Number:</span>
                <span className="font-mono">{user?.licenseNumber || 'On file with Admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cooperative:</span>
                <span>MAVANODA Transport Coop</span>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-[11px] text-slate-500">
                Please contact your <strong>Fleet Administrator</strong> to assign a Jeepney unit to your account.
              </p>
            </div>
          </div>
        ) : (
          /* Assigned Vehicle Dashboard */
          <>
            {/* Vehicle Header Card */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight font-mono">
                      {jeepney.plateNumber}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      IN SERVICE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {jeepney.model || 'Modern PUV Class 2'} &bull; Unit #{jeepney.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                  title="Refresh events"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Route Indicator */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
                    {route ? route.code : (jeepney.assignedRouteId || 'QC-01')}
                  </span>
                  <span className="text-xs text-slate-700 font-medium truncate block">
                    {route ? route.name : 'Philcoa - Anonas via Kalayaan Avenue'}
                  </span>
                </div>
              </div>
            </section>

            {/* Passenger Load & Occupancy Card */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Live Passenger Load
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${occupancyStatus.badge}`}>
                  {occupancyStatus.label}
                </span>
              </div>

              {/* Large Counter Display */}
              <div className="flex items-baseline justify-between py-1">
                <div>
                  <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {currentCount}
                  </span>
                  <span className="text-base font-semibold text-slate-400 font-mono">
                    {' '}/ {capacity} seats
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {availableSeats}
                  </span>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Seats Free
                  </p>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${occupancyStatus.color}`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                <span>Load: <strong>{occupancyPct}%</strong></span>
                <span>Camera AI Confidence: <strong>98.4%</strong></span>
              </div>
            </section>

            {/* Live Edge Telemetry Grid */}
            <section className="grid grid-cols-2 gap-2.5">
              {/* Speed Metric */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-medium">GPS Speed</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {telemetry?.speedKmh ? Math.round(telemetry.speedKmh) : 0} <span className="text-xs font-normal text-slate-500">km/h</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Heading: {telemetry?.heading ? `${Math.round(telemetry.heading)}°` : '0° N'}
                </p>
              </div>

              {/* Doorway Sensor Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                  <Radio className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-medium">Doorway State</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {telemetry?.doorState === 'OPEN' ? (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-sm font-bold text-amber-700 font-mono">DOOR OPEN</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-bold text-emerald-700 font-mono">DOOR CLOSED</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sensors: Dual IR Optical
                </p>
              </div>
            </section>

            {/* IoT Edge Device Badge */}
            <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {device?.deviceId || jeepney.deviceId || 'DEV-ESP32-01'}
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {device?.ipAddress ? `IP: ${device.ipAddress}` : 'Camera AI Active & Streaming'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Connected
              </span>
            </section>

            {/* Recent Boarding / Alighting Activity */}
            <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-slate-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Recent Passenger Events
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Live AI Log</span>
              </div>

              {doorwayEvents.length === 0 ? (
                <div className="py-5 text-center text-slate-400 text-xs">
                  No doorway events recorded yet for this shift.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {doorwayEvents.map((evt) => {
                    const isBoarding = evt.type === 'BOARDING';
                    const timeStr = new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <div
                        key={evt.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          {isBoarding ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              + IN
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              - OUT
                            </span>
                          )}
                          <span className="font-medium text-slate-700">
                            {isBoarding ? 'Passenger Boarded' : 'Passenger Alighted'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                          <span>{timeStr}</span>
                          <span className="font-bold text-slate-600">
                            Total: {evt.countAfter}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
