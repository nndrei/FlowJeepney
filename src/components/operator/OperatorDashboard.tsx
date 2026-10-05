import React from 'react';
import { AuthUser } from '../../types/auth';
import { LogOut, Bus, ShieldCheck, UserCheck, Radio, Layers } from 'lucide-react';

export interface OperatorDashboardProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ user, onLogout }) => {
  const operatorName = user?.name || 'Authorized Dispatcher';
  const operatorId = user?.operatorId || 'OP-MAVANODA-01';
  const cooperative = user?.cooperative || 'MAVANODA Transport Cooperative';

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. Sleek Operator Top Navigation Header */}
      <header className="w-full bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Brand & Cooperative Identity */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <img
              src="/assets/01_flowjeep_logo_exact.png"
              alt="FlowJeep"
              className="h-7 w-auto object-contain select-none"
            />
            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#800020] bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md">
                Operator Portal
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            <Bus className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">
              {cooperative}
            </span>
          </div>
        </div>

        {/* Right: Operator Identity Badge & Logout Action */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Operator Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-medium">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Terminal Connected</span>
          </div>

          {/* Operator Badge */}
          <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {operatorName}
              </p>
              <p className="text-[10.5px] font-mono text-slate-500 leading-tight mt-0.5">
                {operatorId}
              </p>
            </div>
          </div>

          {/* Log Out Action */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
            title="Log Out of Dispatcher Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* 2. Main Body Section: Edge-to-edge desktop/tablet console container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col space-y-6">
        {/* Breadcrumb / Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <span>FlowJeep Operations</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">{cooperative}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Fleet Operations & Terminal Dispatch
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Session Authenticated: {operatorId}</span>
            </span>
          </div>
        </div>

        {/* Blank Workspace Placeholder Container */}
        <div className="flex-1 min-h-[460px] w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xs transition-all">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-[#800020] flex items-center justify-center mb-4 shadow-2xs">
            <Layers className="w-7 h-7 stroke-[1.5]" />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            Fleet Dispatch &amp; Monitoring Console - In Development
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mt-2 leading-relaxed">
            This operator workspace container is connected and authenticated for{' '}
            <strong className="text-slate-700">{cooperative}</strong>. Ready for the upcoming
            interactive dispatch corridor map, vehicle telemetry stream, and live passenger occupancy audit screens.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200/90 rounded-md text-xs font-mono">
              Active Operator: {operatorId}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200/90 rounded-md text-xs font-mono">
              Portal Mode: Full Desktop Workspace
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md text-xs font-mono">
              Role: operator
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
