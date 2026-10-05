import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Truck,
  MapPin,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
  X,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { FlowJeepUser } from '../../types/user';

interface OperatorSettingsViewProps {
  user?: FlowJeepUser | null;
  onLogout?: () => void;
  onBack?: () => void;
}

export const OperatorSettingsView: React.FC<OperatorSettingsViewProps> = ({
  user,
  onLogout,
  onBack,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const menuItems = [
    {
      id: 'account',
      title: 'Account Information',
      icon: User,
      description: 'Operator profile, credentials, and contact details',
    },
    {
      id: 'vehicle',
      title: 'Vehicle Details',
      icon: Truck,
      description: 'Assigned Modern Jeepney unit, telemetry sensor & plate number',
    },
    {
      id: 'route',
      title: 'Route Assignment',
      icon: MapPin,
      description: 'Active franchise corridor, schedules, and depot stops',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Dispatch alerts, route congestion, and maintenance pings',
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: HelpCircle,
      description: 'Operator hotline, FAQs, and depot dispatch contacts',
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto no-scrollbar bg-slate-50/60 pb-20 select-none">
      {/* Top Header */}
      <div className="w-full bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
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
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            Settings
          </h1>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Operator Profile Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center space-x-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            <User className="w-6 h-6 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {user?.name || 'Driver/Operator'}
            </h2>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'operator@flowjeep.com'}
            </p>
            <div className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 mt-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Fleet Operator</span>
            </div>
          </div>
        </div>

        {/* Settings Navigation List */}
        <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModal(item.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer text-left"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                    <Icon className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {item.title}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </div>

        {/* Prominent Red Log Out Button */}
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] text-white text-xs font-semibold rounded-2xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Detail Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {menuItems.find((m) => m.id === activeModal)?.title}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeModal === 'account' && (
              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Full Name</span>
                  <span className="font-semibold text-slate-800">{user?.name || 'Driver / Operator'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                  <span className="font-semibold text-slate-800">{user?.email || 'operator@flowjeep.com'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Role</span>
                  <span className="font-semibold text-red-600">Fleet Operator (Step 1 Separation)</span>
                </div>
              </div>
            )}

            {activeModal === 'vehicle' && (
              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Unit</span>
                  <span className="font-semibold text-slate-800">Modern Electric Jeepney #12</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Plate Number</span>
                  <span className="font-semibold text-slate-800">NCR-8902-E</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Seating Capacity</span>
                  <span className="font-semibold text-slate-800">40 Passengers (28 seated, 12 standing)</span>
                </div>
              </div>
            )}

            {activeModal === 'route' && (
              <div className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Corridor</span>
                  <span className="font-semibold text-slate-800">Route 1 (Baclaran – Monumento)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Shift Hours</span>
                  <span className="font-semibold text-slate-800">06:00 AM – 02:00 PM PST</span>
                </div>
              </div>
            )}

            {activeModal === 'notifications' && (
              <div className="space-y-2 text-xs text-slate-600">
                <p>Push alerts enabled for high passenger clusters along Taft corridor and scheduled depot maintenance.</p>
              </div>
            )}

            {activeModal === 'help' && (
              <div className="space-y-2 text-xs text-slate-600">
                <p>Depot Operations Dispatch: <span className="font-semibold text-slate-900">+63 2 8888 5337</span></p>
                <p>Support Email: <span className="font-semibold text-slate-900">support@flowjeep.ph</span></p>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
