import React, { useState, useEffect } from 'react';
import { Home, Map as MapIcon, BarChart2, User } from 'lucide-react';
import { AuthUser } from '../../types/auth';
import { DriverMapScreen } from './DriverMapScreen';
import { DriverDashboard } from './DriverDashboard';
import { DriverProfileScreen } from './DriverProfileScreen';
import { ForecastScreen } from '../forecast/ForecastScreen';
import { subscribeUserProfile } from '../../services/databaseService';

interface DriverInterfaceProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export type DriverTab = 'dashboard' | 'map' | 'forecast' | 'profile';

export const DriverInterface: React.FC<DriverInterfaceProps> = ({ user, onLogout }) => {
  // Map tab is the primary default tab matching the user's reference mockup
  const [activeTab, setActiveTab] = useState<DriverTab>('map');
  const [liveUser, setLiveUser] = useState<AuthUser | null>(user);

  // Synchronize with user prop when authentication changes
  useEffect(() => {
    setLiveUser(user);
  }, [user]);

  // Live real-time listener for the driver's profile in RTDB (/users)
  useEffect(() => {
    if (!user?.uid && !user?.email) return;
    const unsub = subscribeUserProfile(user?.uid || '', user?.email, (updatedProfile) => {
      if (updatedProfile) {
        setLiveUser((prev) => {
          const merged: AuthUser = {
            ...(prev || user || { uid: '', email: '', name: '', role: 'driver' }),
            ...updatedProfile,
            role: 'driver',
          } as AuthUser;
          try {
            localStorage.setItem('flowjeep_user', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
    return () => unsub();
  }, [user?.uid, user?.email]);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden select-none font-sans relative">
      {/* Active Tab Screen Area */}
      <div className="flex-1 w-full overflow-hidden relative">
        {activeTab === 'map' && (
          <DriverMapScreen user={liveUser} onSelectTab={setActiveTab} />
        )}

        {activeTab === 'dashboard' && (
          <DriverDashboard user={liveUser} onLogout={onLogout} />
        )}

        {activeTab === 'forecast' && (
          <div className="w-full h-full overflow-y-auto no-scrollbar">
            <ForecastScreen
              userPickupName="Malinta – Novaliches Corridor"
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <DriverProfileScreen user={liveUser} onLogout={onLogout} />
        )}
      </div>

      {/* 
        Bottom Navigation Bar (4 Tabs)
        Exactly matching media_1791264948973.png:
        - Dashboard
        - Map (Active: Maroon icon, maroon label, maroon underline indicator)
        - Forecast
        - Profile
      */}
      <nav
        className="w-full h-16 bg-white border-t border-slate-200/90 grid grid-cols-4 items-center z-[1001] px-1 shrink-0 shadow-xs"
        role="navigation"
        aria-label="Driver Navigation"
      >
        {/* Tab 1: Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex flex-col items-center justify-center py-1 transition-colors cursor-pointer group"
          aria-label="Dashboard"
          aria-selected={activeTab === 'dashboard'}
        >
          <Home
            className={`w-5 h-5 transition-colors ${
              activeTab === 'dashboard'
                ? 'text-[#800020]'
                : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
              activeTab === 'dashboard'
                ? 'font-bold text-[#800020]'
                : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}
          >
            Dashboard
          </span>
          {activeTab === 'dashboard' && (
            <div className="w-5 h-[2.5px] bg-[#800020] rounded-full mx-auto mt-0.5 animate-in fade-in duration-150" />
          )}
        </button>

        {/* Tab 2: Map (Active by default) */}
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className="flex flex-col items-center justify-center py-1 transition-colors cursor-pointer group"
          aria-label="Map"
          aria-selected={activeTab === 'map'}
        >
          <MapIcon
            className={`w-5 h-5 transition-colors ${
              activeTab === 'map'
                ? 'text-[#800020]'
                : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
              activeTab === 'map'
                ? 'font-bold text-[#800020]'
                : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}
          >
            Map
          </span>
          {activeTab === 'map' && (
            <div className="w-5 h-[2.5px] bg-[#800020] rounded-full mx-auto mt-0.5 animate-in fade-in duration-150" />
          )}
        </button>

        {/* Tab 3: Forecast */}
        <button
          type="button"
          onClick={() => setActiveTab('forecast')}
          className="flex flex-col items-center justify-center py-1 transition-colors cursor-pointer group"
          aria-label="Forecast"
          aria-selected={activeTab === 'forecast'}
        >
          <BarChart2
            className={`w-5 h-5 transition-colors ${
              activeTab === 'forecast'
                ? 'text-[#800020]'
                : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
              activeTab === 'forecast'
                ? 'font-bold text-[#800020]'
                : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}
          >
            Forecast
          </span>
          {activeTab === 'forecast' && (
            <div className="w-5 h-[2.5px] bg-[#800020] rounded-full mx-auto mt-0.5 animate-in fade-in duration-150" />
          )}
        </button>

        {/* Tab 4: Profile */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="flex flex-col items-center justify-center py-1 transition-colors cursor-pointer group"
          aria-label="Profile"
          aria-selected={activeTab === 'profile'}
        >
          <User
            className={`w-5 h-5 transition-colors ${
              activeTab === 'profile'
                ? 'text-[#800020]'
                : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <span
            className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
              activeTab === 'profile'
                ? 'font-bold text-[#800020]'
                : 'font-medium text-slate-400 group-hover:text-slate-600'
            }`}
          >
            Profile
          </span>
          {activeTab === 'profile' && (
            <div className="w-5 h-[2.5px] bg-[#800020] rounded-full mx-auto mt-0.5 animate-in fade-in duration-150" />
          )}
        </button>
      </nav>
    </div>
  );
};
