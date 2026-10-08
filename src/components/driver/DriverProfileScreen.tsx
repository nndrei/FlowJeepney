import React, { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  Car,
  MapPin,
  Building,
  LogOut,
} from 'lucide-react';
import { AuthUser } from '../../types/auth';
import {
  subscribeAssignedJeepney,
  DriverAssignedVehicleBundle,
} from '../../services/databaseService';

interface DriverProfileScreenProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({ user, onLogout }) => {
  const [bundle, setBundle] = useState<DriverAssignedVehicleBundle>({
    jeepney: null,
    telemetry: null,
    device: null,
    route: null,
  });

  const driverUid = user?.uid || '';
  const driverEmail = user?.email || '';

  // Subscribe to real assigned Jeepney and route in RTDB
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

  const isConnected = Boolean(bundle.jeepney);
  const plateNumber = bundle.jeepney?.plateNumber || user?.assignedPlate || '';
  const cooperative = user?.cooperative || bundle.jeepney?.cooperative || '';
  const unitModel = bundle.jeepney?.model || '';
  const routeName = bundle.route?.name || (bundle.jeepney?.assignedRouteId ? `Route ${bundle.jeepney.assignedRouteId}` : '');

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar">
      {/* Header Profile Card */}
      <div className="p-4 pb-0">
        <div className="bg-[#800020] text-white p-4.5 rounded-3xl shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
              <User className="w-8 h-8 fill-white/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-tight truncate">
                  {user?.name || user?.email?.split('@')[0] || 'FlowJeep Driver'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white border border-white/30 uppercase tracking-wider shrink-0">
                  Active
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5 font-mono">
                Driver ID: {user?.driverId || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 space-y-3.5 pb-8 flex-1">
        {/* Cooperative Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center space-x-2 text-[#800020] mb-2.5">
            <Building className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Transport Cooperative
            </span>
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            {cooperative || 'Not Assigned'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {cooperative
              ? 'Modern Public Utility Vehicle Transport Operator Franchise'
              : 'No cooperative affiliation on file'}
          </p>
        </div>

        {/* Assigned Vehicle & Route Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#800020]">
              <Car className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Assigned Unit
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              plateNumber
                ? 'bg-[#800020]/10 text-[#800020]'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {plateNumber || 'Not Connected'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Plate Number</span>
              <span className={`font-bold font-mono text-sm ${plateNumber ? 'text-slate-900' : 'text-slate-400 font-normal'}`}>
                {plateNumber || '—'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Unit Model</span>
              <span className={`font-bold text-sm ${unitModel || isConnected ? 'text-slate-900' : 'text-slate-400 font-normal'}`}>
                {unitModel || (isConnected ? 'Modern PUV' : '—')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-[#800020] shrink-0" />
            <span className="font-medium truncate">
              Route: <strong className={routeName ? 'text-slate-800' : 'text-slate-400 font-normal'}>
                {routeName || 'Not Assigned'}
              </strong>
            </span>
          </div>
        </div>

        {/* Credentials & Details Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5">
          <div className="flex items-center space-x-2 text-[#800020] mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Driver Credentials
            </span>
          </div>

          <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
            <span className="text-slate-500">License Number:</span>
            <span className={`font-mono ${user?.licenseNumber ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
              {user?.licenseNumber || '—'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
            <span className="text-slate-500">Registered Email:</span>
            <span className={`font-mono ${user?.email ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
              {user?.email || '—'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs py-1">
            <span className="text-slate-500">Contact Number:</span>
            <span className={user?.phone ? 'font-bold text-slate-800' : 'text-slate-400'}>
              {user?.phone || '—'}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-2xl py-3 px-4 font-bold text-sm shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>End Shift & Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
