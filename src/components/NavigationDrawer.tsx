import React from 'react';
import {
  Home,
  Radio,
  Users,
  Settings,
  CircleHelp,
  LogOut,
  X,
  TrendingUp,
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem?: string;
  onSelectItem?: (item: string) => void;
  onLogout?: () => void;
  user?: { name: string; email: string } | null;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeItem = 'Home',
  onSelectItem,
  onLogout,
  user,
}) => {
  if (!isOpen) return null;

  // Resolve user info from prop or localStorage (no mock placeholders)
  const resolvedUser = user || (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowjeep_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  })();

  const displayName = resolvedUser?.name || 'Commuter';
  const displayEmail = resolvedUser?.email || '';

  const handleItemClick = (itemName: string) => {
    onSelectItem?.(itemName);
    if (itemName === 'Log Out') {
      onLogout?.();
    } else {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content panel */}
      <aside
        className="relative w-[280px] max-w-[80%] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300 select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* User Profile Header */}
        <div className="px-5 pt-8 pb-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3.5 overflow-hidden">
            {/* User Avatar */}
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0 shadow-xs">
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 fill-current"
                aria-hidden="true"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            {/* User Info */}
            <div className="overflow-hidden">
              <h2 className="text-[16px] font-bold text-slate-800 leading-tight truncate">
                {displayName}
              </h2>
              {displayEmail ? (
                <p className="text-[12.5px] text-slate-400 mt-0.5 truncate font-normal">
                  {displayEmail}
                </p>
              ) : null}
            </div>
          </div>

          {/* Close button for accessibility */}
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-slate-500 rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Menu Items */}
        <div className="flex-1 py-3 px-3 overflow-y-auto space-y-1">
          {/* Home */}
          <button
            onClick={() => handleItemClick('Home')}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl transition-colors cursor-pointer ${
              activeItem === 'Home'
                ? 'bg-[#800020]/[0.06] text-[#800020] border border-[#800020]/15 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-900/[0.03]'
            }`}
          >
            <Home
              className={`w-5 h-5 shrink-0 ${
                activeItem === 'Home' ? 'text-[#800020] fill-[#800020]' : 'text-slate-700'
              }`}
            />
            <span
              className={`text-[15px] ${
                activeItem === 'Home' ? 'font-bold text-[#800020]' : 'font-medium text-slate-800'
              }`}
            >
              Home
            </span>
          </button>

          {/* I Am Waiting */}
          <button
            onClick={() => handleItemClick('Wait for a Jeep')}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl transition-colors cursor-pointer ${
              activeItem === 'Wait for a Jeep' || activeItem === 'Wait' || activeItem === 'I Am Waiting'
                ? 'bg-[#800020]/[0.06] text-[#800020] border border-[#800020]/15 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-900/[0.03]'
            }`}
          >
            <Radio
              className={`w-5 h-5 shrink-0 ${
                activeItem === 'Wait for a Jeep' || activeItem === 'Wait' || activeItem === 'I Am Waiting'
                  ? 'text-[#800020]'
                  : 'text-slate-700'
              }`}
            />
            <span
              className={`text-[15px] ${
                activeItem === 'Wait for a Jeep' || activeItem === 'Wait' || activeItem === 'I Am Waiting'
                  ? 'font-bold text-[#800020]'
                  : 'font-medium text-slate-800'
              }`}
            >
              I Am Waiting
            </span>
          </button>

          {/* Forecast (Replacing Map) */}
          <button
            onClick={() => handleItemClick('Forecast')}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl transition-colors cursor-pointer ${
              activeItem === 'Forecast'
                ? 'bg-[#800020]/[0.06] text-[#800020] border border-[#800020]/15 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-900/[0.03]'
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 shrink-0 ${
                activeItem === 'Forecast' ? 'text-[#800020]' : 'text-slate-700'
              }`}
            />
            <span
              className={`text-[15px] ${
                activeItem === 'Forecast' ? 'font-bold text-[#800020]' : 'font-medium text-slate-800'
              }`}
            >
              Passenger Load Forecast
            </span>
          </button>

          {/* Divider */}
          <div className="py-1">
            <div className="border-t border-slate-100 mx-2" />
          </div>

          {/* Settings */}
          <button
            onClick={() => handleItemClick('Settings')}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl transition-colors cursor-pointer ${
              activeItem === 'Settings'
                ? 'bg-[#800020]/[0.06] text-[#800020] border border-[#800020]/15 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-900/[0.03]'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-700 shrink-0" />
            <span className="text-[15px] font-medium text-slate-800">
              Settings
            </span>
          </button>

          {/* Help & Support */}
          <button
            onClick={() => handleItemClick('Help & Support')}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl transition-colors cursor-pointer ${
              activeItem === 'Help & Support'
                ? 'bg-[#800020]/[0.06] text-[#800020] border border-[#800020]/15 shadow-2xs'
                : 'text-slate-700 hover:bg-slate-900/[0.03]'
            }`}
          >
            <CircleHelp className="w-5 h-5 text-slate-700 shrink-0" />
            <span className="text-[15px] font-medium text-slate-800">
              Help & Support
            </span>
          </button>

          {/* Divider */}
          <div className="py-1">
            <div className="border-t border-slate-100 mx-2" />
          </div>

          {/* Log Out */}
          <button
            onClick={() => handleItemClick('Log Out')}
            className="w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl text-slate-700 hover:bg-red-50 hover:text-[#800020] transition-colors cursor-pointer group"
          >
            <LogOut className="w-5 h-5 text-slate-700 group-hover:text-[#800020] shrink-0 transition-colors" />
            <span className="text-[15px] font-medium text-slate-800 group-hover:text-[#800020] transition-colors">
              Log Out
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
};
