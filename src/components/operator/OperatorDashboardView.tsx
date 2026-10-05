import React from 'react';
import { Moon, TrendingUp, ChevronRight, User } from 'lucide-react';
import { FlowJeepUser } from '../../types/user';
import { OperatorVanIcon } from './OperatorLogo';

interface OperatorDashboardViewProps {
  user?: FlowJeepUser | null;
  onSelectRoute: (routeId: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'routes' | 'map' | 'profile') => void;
}

export const OperatorDashboardView: React.FC<OperatorDashboardViewProps> = ({
  user,
  onSelectRoute,
  onNavigateTab,
}) => {
  // Routes list from design screenshot
  const fleetRoutes = [
    {
      id: 'route-1',
      code: 'Route 1',
      title: 'Baclaran – Monumento',
      status: 'Full',
      statusStyle: 'bg-red-50 text-red-600 border border-red-200',
      iconBg: 'bg-red-600 text-white',
      loadPct: 85,
    },
    {
      id: 'route-2',
      code: 'Route 2',
      title: 'Cubao – Pasay',
      status: 'Not Full',
      statusStyle: 'bg-slate-100 text-slate-600 border border-slate-200',
      iconBg: 'bg-rose-500 text-white',
      loadPct: 40,
    },
    {
      id: 'route-3',
      code: 'Route 3',
      title: 'Cubao – Guadalupe',
      status: 'Moderate',
      statusStyle: 'bg-amber-50 text-amber-700 border border-amber-200',
      iconBg: 'bg-slate-800 text-white',
      loadPct: 65,
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col overflow-y-auto no-scrollbar bg-slate-50/50 pb-20 select-none">
      {/* Top Greeting Header */}
      <div className="w-full px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Moon className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <p className="text-[12px] text-slate-500 leading-tight">Good morning,</p>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {user?.name || 'Driver/Operator'}
            </h1>
          </div>
        </div>

        {/* Profile Avatar on Right */}
        <button
          onClick={() => onNavigateTab('profile')}
          className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 border border-slate-300 flex items-center justify-center text-slate-600 transition cursor-pointer"
          title="Operator Settings"
        >
          <User className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="px-5 space-y-4 pt-1">
        {/* Top 2 KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Active Jeepneys
            </span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              12
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Total Passengers Today
            </span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              1,245
            </span>
          </div>
        </div>

        {/* On-Time Rate Red Gradient Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#EF4444] p-4 text-white shadow-sm">
          {/* Subtle curved wave watermark */}
          <div className="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-12 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/90 font-medium mb-0.5">On-Time Rate</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl font-extrabold tracking-tight">96%</span>
                <span className="text-sm font-semibold text-white/90">↑</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-white">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+2%</span>
            </div>
          </div>
        </div>

        {/* Live Fleet Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Live Fleet</h2>
            <button
              onClick={() => onNavigateTab('routes')}
              className="text-xs font-semibold text-slate-500 hover:text-[#DC2626] transition cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {fleetRoutes.map((route) => (
              <div
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                className="w-full bg-white border border-slate-200/90 hover:border-red-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:shadow-xs transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full ${route.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    <OperatorVanIcon className="w-5 h-5" color="#FFFFFF" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {route.code}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {route.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${route.statusStyle}`}
                  >
                    {route.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
