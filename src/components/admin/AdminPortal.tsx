import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  Cpu,
  Activity,
  LogOut,
  Plus,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Link,
  Unlink,
  RefreshCw,
  Search,
  Check,
  MapPin,
  Shield,
  Gauge,
  Radio,
} from 'lucide-react';
import { AuthUser } from '../../types/auth';
import {
  UserRecord,
  JeepneyRecord,
  DeviceRecord,
  RouteRecord,
  LiveTelemetryRecord,
} from '../../types/database';
import {
  subscribeJeepneys,
  subscribeDrivers,
  subscribeDevices,
  subscribeLiveTelemetry,
  getAllRoutes,
  assignDriverToJeepney,
  unassignDriverFromJeepney,
  assignDeviceToJeepney,
  unassignDeviceFromJeepney,
  createDriverAccount,
  registerJeepney,
  registerDevice,
} from '../../services/databaseService';

interface AdminPortalProps {
  user: AuthUser | null;
  onLogout: () => void;
}

type AdminTab = 'assignments' | 'drivers' | 'devices' | 'fleet_telemetry';

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('assignments');
  const [jeepneys, setJeepneys] = useState<JeepneyRecord[]>([]);
  const [drivers, setDrivers] = useState<UserRecord[]>([]);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [telemetries, setTelemetries] = useState<Record<string, LiveTelemetryRecord>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal / Form States
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showAddJeepneyModal, setShowAddJeepneyModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);

  // Driver Form
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverEmail, setNewDriverEmail] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverLicense, setNewDriverLicense] = useState('');
  const [newDriverCoop, setNewDriverCoop] = useState('MAVANODA Transport Cooperative');

  // Jeepney Form
  const [newJeepneyId, setNewJeepneyId] = useState('');
  const [newJeepneyPlate, setNewJeepneyPlate] = useState('');
  const [newJeepneyModel, setNewJeepneyModel] = useState('Isuzu Modern PUV Class 2');
  const [newJeepneyCapacity, setNewJeepneyCapacity] = useState('22');
  const [newJeepneyRoute, setNewJeepneyRoute] = useState('RT-QC-01');

  // Device Form
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceIp, setNewDeviceIp] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('ESP32-CAM AI Core');

  // Subscriptions setup
  useEffect(() => {
    const unsubJeeps = subscribeJeepneys(setJeepneys);
    const unsubDrivers = subscribeDrivers(setDrivers);
    const unsubDevices = subscribeDevices(setDevices);
    const unsubTelemetry = subscribeLiveTelemetry((records) => {
      const map: Record<string, LiveTelemetryRecord> = {};
      records.forEach((rec) => {
        map[rec.jeepneyId] = rec;
      });
      setTelemetries(map);
    });

    getAllRoutes().then(setRoutes).catch(() => {});

    return () => {
      unsubJeeps();
      unsubDrivers();
      unsubDevices();
      unsubTelemetry();
    };
  }, []);

  const showFeedback = (text: string, isError = false) => {
    setActionMessage({ text, isError });
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Action Handlers
  const handleAssignDriver = async (jeepneyId: string, driverUid: string) => {
    if (!driverUid) return;
    try {
      const driver = drivers.find((d) => d.uid === driverUid);
      await assignDriverToJeepney(jeepneyId, driverUid, driver?.name);
      showFeedback(`Driver assigned to vehicle successfully.`);
    } catch (err: any) {
      showFeedback(`Assignment failed: ${err.message}`, true);
    }
  };

  const handleUnassignDriver = async (jeepneyId: string) => {
    try {
      await unassignDriverFromJeepney(jeepneyId);
      showFeedback(`Driver unassigned from vehicle.`);
    } catch (err: any) {
      showFeedback(`Failed to unassign driver: ${err.message}`, true);
    }
  };

  const handleAssignDevice = async (jeepneyId: string, deviceId: string) => {
    if (!deviceId) return;
    try {
      await assignDeviceToJeepney(jeepneyId, deviceId);
      showFeedback(`IoT Device assigned to vehicle.`);
    } catch (err: any) {
      showFeedback(`Device assignment failed: ${err.message}`, true);
    }
  };

  const handleUnassignDevice = async (jeepneyId: string, deviceId: string) => {
    try {
      await unassignDeviceFromJeepney(jeepneyId, deviceId);
      showFeedback(`IoT Device detached from vehicle.`);
    } catch (err: any) {
      showFeedback(`Failed to unassign device: ${err.message}`, true);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverEmail) {
      showFeedback('Please provide driver name and email.', true);
      return;
    }
    try {
      await createDriverAccount({
        name: newDriverName.trim(),
        email: newDriverEmail.trim().toLowerCase(),
        phone: newDriverPhone.trim(),
        licenseNumber: newDriverLicense.trim(),
        cooperative: newDriverCoop.trim(),
      });
      showFeedback(`Driver ${newDriverName} created successfully.`);
      setNewDriverName('');
      setNewDriverEmail('');
      setNewDriverPhone('');
      setNewDriverLicense('');
      setShowAddDriverModal(false);
    } catch (err: any) {
      showFeedback(`Failed to create driver: ${err.message}`, true);
    }
  };

  const handleRegisterJeepney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJeepneyId || !newJeepneyPlate) {
      showFeedback('Please provide vehicle ID and plate number.', true);
      return;
    }
    try {
      await registerJeepney({
        id: newJeepneyId.trim().toUpperCase(),
        plateNumber: newJeepneyPlate.trim().toUpperCase(),
        model: newJeepneyModel.trim(),
        capacity: parseInt(newJeepneyCapacity, 10) || 22,
        assignedRouteId: newJeepneyRoute,
        status: 'OUT_OF_SERVICE',
        createdAt: Date.now(),
      });
      showFeedback(`Vehicle ${newJeepneyPlate} registered successfully.`);
      setNewJeepneyId('');
      setNewJeepneyPlate('');
      setShowAddJeepneyModal(false);
    } catch (err: any) {
      showFeedback(`Failed to register vehicle: ${err.message}`, true);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId) {
      showFeedback('Please provide device ID.', true);
      return;
    }
    try {
      await registerDevice({
        deviceId: newDeviceId.trim().toUpperCase(),
        ipAddress: newDeviceIp.trim() || '192.168.100.173',
        model: newDeviceModel.trim(),
        status: 'ONLINE',
        lastHeartbeat: Date.now(),
        registeredAt: Date.now(),
      });
      showFeedback(`Device ${newDeviceId} registered.`);
      setNewDeviceId('');
      setNewDeviceIp('');
      setShowAddDeviceModal(false);
    } catch (err: any) {
      showFeedback(`Failed to register device: ${err.message}`, true);
    }
  };

  // Filtered lists
  const filteredJeepneys = jeepneys.filter((j) =>
    j.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.currentDriverName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 text-slate-900 select-none overflow-y-auto no-scrollbar">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[13px] font-bold text-white tracking-tight">FlowJeep</span>
              <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-black rounded uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 truncate max-w-[170px]">
              {user?.displayName || user?.name || user?.email || 'Fleet Administrator'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-red-600 hover:border-red-600 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </header>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`px-4 py-2 text-xs font-semibold text-center transition-all ${
            actionMessage.isError
              ? 'bg-red-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'assignments'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Fleet &amp; Assign</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'drivers'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Drivers ({drivers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('devices')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'devices'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Devices ({devices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fleet_telemetry')}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'fleet_telemetry'
              ? 'bg-red-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Fleet</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <main className="p-3.5 space-y-3.5 flex-1 pb-10">
        {/* ========================================================================= */}
        {/* TAB 1: FLEET & ASSIGNMENTS                                                */}
        {/* ========================================================================= */}
        {activeTab === 'assignments' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 mr-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search plate or driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddJeepneyModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Jeep</span>
              </button>
            </div>

            {filteredJeepneys.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
                No vehicles matching search.
              </div>
            ) : (
              filteredJeepneys.map((jp) => {
                const tel = telemetries[jp.id];
                const route = routes.find((r) => r.id === jp.assignedRouteId);

                return (
                  <div
                    key={jp.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3"
                  >
                    {/* Vehicle Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-black font-mono text-slate-900 tracking-tight">
                            {jp.plateNumber}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider ${
                              jp.status === 'IN_SERVICE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {jp.status === 'IN_SERVICE' ? 'IN SERVICE' : 'STANDBY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {jp.model || 'Modern PUV'} &bull; Cap: {jp.capacity || 22} seats
                        </p>
                      </div>

                      {/* Live Load snippet */}
                      {tel && (
                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-slate-800">
                            {tel.currentPassengerCount ?? 0} / {jp.capacity || 22} pax
                          </div>
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            {tel.speedKmh ? `${Math.round(tel.speedKmh)} km/h` : '0 km/h'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Route line */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {route ? `${route.code}: ${route.name}` : jp.assignedRouteId || 'No Route'}
                      </span>
                    </div>

                    {/* DRIVER ASSIGNMENT ROW */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700 flex items-center space-x-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>Assigned Driver:</span>
                        </span>
                        {jp.currentDriverUid && (
                          <button
                            type="button"
                            onClick={() => handleUnassignDriver(jp.id)}
                            className="text-[10.5px] text-red-600 hover:text-red-800 font-semibold flex items-center space-x-0.5 cursor-pointer"
                          >
                            <Unlink className="w-3 h-3" />
                            <span>Unassign</span>
                          </button>
                        )}
                      </div>

                      {jp.currentDriverUid ? (
                        <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-950">
                              {jp.currentDriverName || 'Assigned Driver'}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-mono">
                            UID: {jp.currentDriverUid.slice(0, 8)}...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignDriver(jp.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:border-red-500 outline-none"
                          >
                            <option value="" disabled>
                              Select Driver to Assign...
                            </option>
                            {drivers.map((drv) => (
                              <option key={drv.uid} value={drv.uid}>
                                {drv.name} ({drv.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* IOT DEVICE ASSIGNMENT ROW */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700 flex items-center space-x-1">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          <span>IoT Vision Device:</span>
                        </span>
                        {jp.deviceId && (
                          <button
                            type="button"
                            onClick={() => handleUnassignDevice(jp.id, jp.deviceId!)}
                            className="text-[10.5px] text-red-600 hover:text-red-800 font-semibold flex items-center space-x-0.5 cursor-pointer"
                          >
                            <Unlink className="w-3 h-3" />
                            <span>Detach</span>
                          </button>
                        )}
                      </div>

                      {jp.deviceId ? (
                        <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200 rounded-lg px-2.5 py-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-mono font-bold text-indigo-950">
                              {jp.deviceId}
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-700">
                            Edge Active
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignDevice(jp.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:border-red-500 outline-none"
                          >
                            <option value="" disabled>
                              Attach IoT Device...
                            </option>
                            {devices.map((dev) => (
                              <option key={dev.deviceId} value={dev.deviceId}>
                                {dev.deviceId} ({dev.ipAddress || 'LAN'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DRIVERS MANAGEMENT                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'drivers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Registered Drivers ({drivers.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddDriverModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Driver</span>
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
                No drivers registered yet.
              </div>
            ) : (
              drivers.map((drv) => (
                <div
                  key={drv.uid}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{drv.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{drv.email}</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      Driver
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block">License:</span>
                      <span className="font-mono">{drv.licenseNumber || 'Verified on file'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone:</span>
                      <span className="font-mono">{drv.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Vehicle Assignment:</span>
                    {drv.assignedJeepneyId ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        {drv.assignedPlate || drv.assignedJeepneyId}
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: IOT DEVICES                                                        */}
        {/* ========================================================================= */}
        {activeTab === 'devices' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Edge Camera Devices ({devices.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddDeviceModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Device</span>
              </button>
            </div>

            {devices.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
                No IoT devices registered.
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev.deviceId}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h3 className="text-sm font-bold font-mono text-slate-900">
                          {dev.deviceId}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {dev.model || 'ESP32-CAM AI Vision'} &bull; IP: {dev.ipAddress || '192.168.100.173'}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Mounted To:</span>
                    {dev.jeepneyId ? (
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                        {dev.jeepneyId}
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Unassigned Pool
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE FLEET TELEMETRY                                               */}
        {/* ========================================================================= */}
        {activeTab === 'fleet_telemetry' && (
          <div className="space-y-3">
            {/* Quick Fleet Health */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10.5px] text-slate-500 font-medium">Active Fleet</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {jeepneys.filter((j) => j.status === 'IN_SERVICE').length} / {jeepneys.length}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10.5px] text-slate-500 font-medium">Assigned Drivers</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  {jeepneys.filter((j) => j.currentDriverUid).length} / {drivers.length}
                </div>
              </div>
            </div>

            {/* Live Units */}
            <div className="space-y-2.5">
              {jeepneys.map((jp) => {
                const tel = telemetries[jp.id];
                return (
                  <div
                    key={jp.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-slate-700" />
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {jp.plateNumber}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {jp.currentDriverName || 'No Driver'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Occupancy</span>
                        <span className="font-bold font-mono text-slate-800">
                          {tel?.currentPassengerCount ?? 0} / {jp.capacity || 22}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Speed</span>
                        <span className="font-bold font-mono text-slate-800">
                          {tel?.speedKmh ? `${Math.round(tel.speedKmh)} km/h` : '0 km/h'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Door</span>
                        <span
                          className={`font-bold font-mono ${
                            tel?.doorState === 'OPEN' ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {tel?.doorState || 'CLOSED'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD DRIVER */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Create Driver Account</h2>
              <button
                type="button"
                onClick={() => setShowAddDriverModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Danilo Cruz"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. danilo.driver@flowjeep.ph"
                  value={newDriverEmail}
                  onChange={(e) => setNewDriverEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0917-123-4567"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Driver License No.</label>
                <input
                  type="text"
                  placeholder="e.g. N01-14-049812"
                  value={newDriverLicense}
                  onChange={(e) => setNewDriverLicense(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer shadow-2xs"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER JEEPNEY */}
      {showAddJeepneyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Register Modern Jeepney</h2>
              <button
                type="button"
                onClick={() => setShowAddJeepneyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterJeepney} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Jeepney ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JEEP-NCR-0483"
                  value={newJeepneyId}
                  onChange={(e) => setNewJeepneyId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NDL-9942"
                  value={newJeepneyPlate}
                  onChange={(e) => setNewJeepneyPlate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Passenger Capacity</label>
                <input
                  type="number"
                  required
                  value={newJeepneyCapacity}
                  onChange={(e) => setNewJeepneyCapacity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Assigned Route</label>
                <select
                  value={newJeepneyRoute}
                  onChange={(e) => setNewJeepneyRoute(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddJeepneyModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer shadow-2xs"
                >
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER DEVICE */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Register IoT Vision Device</h2>
              <button
                type="button"
                onClick={() => setShowAddDeviceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Device ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DEV-ESP32-02"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">IP Address</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.100.174"
                  value={newDeviceIp}
                  onChange={(e) => setNewDeviceIp(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer shadow-2xs"
                >
                  Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
