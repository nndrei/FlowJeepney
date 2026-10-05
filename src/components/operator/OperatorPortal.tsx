import React, { useState } from 'react';
import { LayoutDashboard, Route, MapPin, User as UserIcon } from 'lucide-react';
import { OperatorScreen, OperatorUser } from './types';
import { OperatorSplash } from './OperatorSplash';
import { OperatorLogin } from './OperatorLogin';
import { OperatorDashboardScreen } from './OperatorDashboardScreen';
import { OperatorLiveTrackingScreen } from './OperatorLiveTrackingScreen';
import { OperatorPassengerLoadScreen } from './OperatorPassengerLoadScreen';
import { OperatorDemandMapScreen } from './OperatorDemandMapScreen';
import { OperatorSettingsScreen } from './OperatorSettingsScreen';

interface OperatorPortalProps {
  initialUser?: OperatorUser | null;
  onLoginSuccess?: (user: OperatorUser) => void;
  onLogout: () => void;
  onSwitchToCommuter: () => void;
}

export const OperatorPortal: React.FC<OperatorPortalProps> = ({
  initialUser,
  onLoginSuccess,
  onLogout,
  onSwitchToCommuter,
}) => {
  // The front page of the operator side is ALWAYS the Operator Splash screen (matching image.png)
  const isAlreadyOperator = !!(initialUser && initialUser.role === 'operator');
  const [activeScreen, setActiveScreen] = useState<OperatorScreen>('splash');

  const [currentUser, setCurrentUser] = useState<OperatorUser>(() => {
    return (
      initialUser || {
        name: 'Aldrian Cabaccan',
        email: 'aldriancabaccan905@gmail.com',
        role: 'operator',
        assignedRouteId: 'route-1',
        assignedPlate: 'NDL-8421',
      }
    );
  });

  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-1');

  const handleLoginSuccess = (user: OperatorUser) => {
    setCurrentUser(user);
    onLoginSuccess?.(user);
    setActiveScreen('dashboard');
  };

  const handleLogout = () => {
    setActiveScreen('login');
    onLogout();
  };

  // Top-level tabs for bottom navigation bar
  const isTopLevelTab =
    activeScreen === 'dashboard' ||
    activeScreen === 'live-tracking' ||
    activeScreen === 'demand-map' ||
    activeScreen === 'settings';

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative font-sans">
      {/* 1. Main Active Screen Viewport */}
      <div className="flex-1 w-full overflow-hidden flex flex-col relative">
        {activeScreen === 'splash' && (
          <OperatorSplash
            onContinue={() => {
              // If account is already authorized as operator, advance directly to dashboard
              if (isAlreadyOperator) {
                setActiveScreen('dashboard');
              } else {
                setActiveScreen('login');
              }
            }}
          />
        )}

        {activeScreen === 'login' && (
          <OperatorLogin
            onLoginSuccess={handleLoginSuccess}
            onSwitchToCommuter={onSwitchToCommuter}
          />
        )}

        {activeScreen === 'dashboard' && (
          <OperatorDashboardScreen
            user={currentUser}
            onNavigateToTracking={(routeId: string) => {
              setSelectedRouteId(routeId);
              setActiveScreen('live-tracking');
            }}
            onNavigateToSettings={() => setActiveScreen('settings')}
          />
        )}

        {activeScreen === 'live-tracking' && (
          <OperatorLiveTrackingScreen
            routeId={selectedRouteId}
            onBack={() => setActiveScreen('dashboard')}
            onNavigateToPassengerLoad={(routeId: string) => {
              setSelectedRouteId(routeId);
              setActiveScreen('passenger-load');
            }}
          />
        )}

        {activeScreen === 'passenger-load' && (
          <OperatorPassengerLoadScreen
            routeId={selectedRouteId}
            onBack={() => setActiveScreen('live-tracking')}
          />
        )}

        {activeScreen === 'demand-map' && (
          <OperatorDemandMapScreen onBack={() => setActiveScreen('dashboard')} />
        )}

        {activeScreen === 'settings' && (
          <OperatorSettingsScreen
            user={currentUser}
            onBack={() => setActiveScreen('dashboard')}
            onLogout={handleLogout}
            onSwitchToCommuter={onSwitchToCommuter}
          />
        )}
      </div>

      {/* 2. Persistent Bottom Navigation Bar matching mockups */}
      {isTopLevelTab && (
        <nav className="bg-white border-t border-slate-200/80 px-6 py-2 flex items-center justify-between shrink-0 z-40 shadow-xs">
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onClick={() => setActiveScreen('dashboard')}
            className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
              activeScreen === 'dashboard'
                ? 'text-[#E31B23]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard
              className={`w-5 h-5 ${
                activeScreen === 'dashboard' ? 'stroke-[2.5] text-[#E31B23]' : 'stroke-[1.8]'
              }`}
            />
            <span
              className={`text-[11px] mt-1 ${
                activeScreen === 'dashboard' ? 'font-bold text-[#E31B23]' : 'font-medium'
              }`}
            >
              Dashboard
            </span>
          </button>

          {/* Tab 2: Routes / Live Tracking */}
          <button
            type="button"
            onClick={() => setActiveScreen('live-tracking')}
            className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
              activeScreen === 'live-tracking'
                ? 'text-[#E31B23]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Route
              className={`w-5 h-5 ${
                activeScreen === 'live-tracking'
                  ? 'stroke-[2.5] text-[#E31B23]'
                  : 'stroke-[1.8]'
              }`}
            />
            <span
              className={`text-[11px] mt-1 ${
                activeScreen === 'live-tracking' ? 'font-bold text-[#E31B23]' : 'font-medium'
              }`}
            >
              Routes
            </span>
          </button>

          {/* Tab 3: Demand Map */}
          <button
            type="button"
            onClick={() => setActiveScreen('demand-map')}
            className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
              activeScreen === 'demand-map'
                ? 'text-[#E31B23]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin
              className={`w-5 h-5 ${
                activeScreen === 'demand-map' ? 'stroke-[2.5] text-[#E31B23]' : 'stroke-[1.8]'
              }`}
            />
            <span
              className={`text-[11px] mt-1 ${
                activeScreen === 'demand-map' ? 'font-bold text-[#E31B23]' : 'font-medium'
              }`}
            >
              Map
            </span>
          </button>

          {/* Tab 4: Profile / Settings */}
          <button
            type="button"
            onClick={() => setActiveScreen('settings')}
            className={`flex flex-col items-center py-1 transition-colors cursor-pointer ${
              activeScreen === 'settings' ? 'text-[#E31B23]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon
              className={`w-5 h-5 ${
                activeScreen === 'settings' ? 'stroke-[2.5] text-[#E31B23]' : 'stroke-[1.8]'
              }`}
            />
            <span
              className={`text-[11px] mt-1 ${
                activeScreen === 'settings' ? 'font-bold text-[#E31B23]' : 'font-medium'
              }`}
            >
              Profile
            </span>
          </button>
        </nav>
      )}
    </div>
  );
};
