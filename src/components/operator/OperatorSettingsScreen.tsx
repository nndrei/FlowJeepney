import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Car,
  MapPin,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
  X,
  CheckCircle2,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { OperatorUser } from './types';

interface OperatorSettingsScreenProps {
  user: OperatorUser;
  onBack: () => void;
  onLogout: () => void;
  onSwitchToCommuter: () => void;
}

export const OperatorSettingsScreen: React.FC<OperatorSettingsScreenProps> = ({
  user,
  onBack,
  onLogout,
  onSwitchToCommuter,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white text-slate-800 select-none overflow-y-auto no-scrollbar pb-20 relative">
      {/* 1. Header with Back Arrow */}
      <div className="w-full px-4 pt-3.5 pb-2.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Settings</h1>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          Admin Assigned
        </span>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 px-5 pt-3 space-y-4">
        {/* 2. Profile Badge Card matching 07_operator_settings.png */}
        <div className="flex items-center space-x-3.5 py-3 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-white shadow-2xs flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
            <User className="w-7 h-7 fill-slate-500 text-slate-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {user.name || 'Driver/Operator'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {user.email || 'operator@flowjeep.com'}
            </p>
          </div>
        </div>

        {/* 3. Action Menu Items matching 07_operator_settings.png */}
        <div className="space-y-1 divide-y divide-slate-100/80">
          {/* Account Information */}
          <button
            type="button"
            onClick={() => setActiveModal('account')}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3 text-slate-700 group-hover:text-slate-900">
              <User className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-sm font-semibold">Account Information</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Vehicle Details */}
          <button
            type="button"
            onClick={() => setActiveModal('vehicle')}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3 text-slate-700 group-hover:text-slate-900">
              <Car className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-sm font-semibold">Vehicle Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Route Assignment */}
          <button
            type="button"
            onClick={() => setActiveModal('route')}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3 text-slate-700 group-hover:text-slate-900">
              <MapPin className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-sm font-semibold">Route Assignment</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => setActiveModal('notifications')}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3 text-slate-700 group-hover:text-slate-900">
              <Bell className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-sm font-semibold">Notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">
                {notificationsEnabled ? 'Enabled' : 'Muted'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>

          {/* Help & Support */}
          <button
            type="button"
            onClick={() => setActiveModal('support')}
            className="w-full py-3.5 flex items-center justify-between text-left hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-3 text-slate-700 group-hover:text-slate-900">
              <HelpCircle className="w-5 h-5 text-slate-700 stroke-[1.8]" />
              <span className="text-sm font-semibold">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Action: Red Log Out Button matching 07_operator_settings.png */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 px-4 bg-[#E31B23] hover:bg-[#C81017] active:bg-[#B91C1C] text-white text-sm font-bold rounded-2xl shadow-md transition-colors cursor-pointer text-center flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Settings Detail Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {activeModal.replace('-', ' ')}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Info Modal */}
            {activeModal === 'account' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">Operator Name</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{user.name}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">Official Dispatch Email</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{user.email}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">LTFRB Operator License</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">NCR-OP-2026-9042</p>
                </div>
              </div>
            )}

            {/* Vehicle Details Modal */}
            {activeModal === 'vehicle' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">Assigned Modern Unit</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    Class 2 Modern PUJ (Euro 4)
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">License Plate Number</span>
                  <p className="text-sm font-bold text-[#E31B23] mt-0.5">NDL-8421</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-medium">IoT Gateway Node</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">ESP32-S3-04A</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                    Online
                  </span>
                </div>
              </div>
            )}

            {/* Route Assignment Modal */}
            {activeModal === 'route' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">Active Authorized Corridor</span>
                  <p className="text-sm font-bold text-[#E31B23] mt-0.5">
                    Route 1: Baclaran – Monumento
                  </p>
                  <p className="text-slate-500 mt-1">Total Distance: 14.8 km via Taft Avenue</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">Shift Schedule</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">06:00 AM – 02:00 PM</p>
                </div>
              </div>
            )}

            {/* Notifications Modal */}
            {activeModal === 'notifications' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Commuter Demand Alerts</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Notify when &gt;10 commuters wait at stop
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#E31B23]"
                  />
                </div>
              </div>
            )}

            {/* Support Modal */}
            {activeModal === 'support' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-800">Central Dispatch Hotline</p>
                  <p className="text-sm font-bold text-[#E31B23] mt-0.5">(02) 8888-JEEP (5337)</p>
                  <p className="text-slate-400 text-[11px] mt-1">Available 24/7 for operators</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
