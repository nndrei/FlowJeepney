import React, { useState } from 'react';
import { Home, Route as RouteIcon, MapPin, User, Sparkles } from 'lucide-react';
import { FlowJeepUser } from '../types/user';
import { OperatorDashboardView } from './operator/OperatorDashboardView';
import { OperatorLiveTrackingView } from './operator/OperatorLiveTrackingView';
import { OperatorPassengerLoadView } from './operator/OperatorPassengerLoadView';
import { OperatorDemandMapView } from './operator/OperatorDemandMapView';
import { OperatorSettingsView } from './operator/OperatorSettingsView';
import { OperatorSplashScreen } from './operator/OperatorSplashScreen';

interface OperatorInterfaceProps {
  user?: FlowJeepUser | null;
  onLogout?: () => void;
}

type OperatorTab = 'dashboard' | 'routes' | 'map' | 'profile';
type OperatorSubView = 'none' | 'tracking' | 'passenger_load';

export const OperatorInterface: React.FC<OperatorInterfaceProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<OperatorTab>('dashboard');
  const [activeSubView, setActiveSubView] = useState<OperatorSubView>('none');
  const [selectedRoute, setSelectedRoute] = useState<{ id: string; code: string; name: string }>({
    id: 'route-1',
    code: 'Route 1',
    name: 'Baclaran – Monumento',
  });
  const [showSplash, setShowSplash] = useState(false);

  const handleSelectRoute = (routeId: string) => {
    if (routeId === 'route-2') {
      setSelectedRoute({ id: 'route-2', code: 'Route 2', name: 'Cubao – Pasay' });
    } else if (routeId === 'route-3') {
      setSelectedRoute({ id: 'route-3', code: 'Route 3', name: 'Cubao – Guadalupe' });
    } else {
      setSelectedRoute({ id: 'route-1', code: 'Route 1', name: 'Baclaran – Monumento' });
    }
    setActiveSubView('tracking');
  };

  if (showSplash) {
    return <OperatorSplashScreen onDismiss={() => setShowSplash(false)} />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden select-none font-sans">
      {/* Active Screen Rendering */}
      <div className="flex-1 w-full overflow-hidden flex flex-col relative">
        {/* Sub-view: Passenger Load (Screen 5) */}
        {activeSubView === 'passenger_load' ? (
          <OperatorPassengerLoadView
            onBack={() => setActiveSubView('tracking')}
            routeCode={selectedRoute.code}
            routeName={selectedRoute.name}
          />
        ) : activeSubView === 'tracking' ? (
          /* Sub-view: Live Tracking (Screen 4) */
          <OperatorLiveTrackingView
            onBack={() => setActiveSubView('none')}
            onOpenPassengerLoad={() => setActiveSubView('passenger_load')}
            routeCode={selectedRoute.code}
            routeName={selectedRoute.name}
          />
        ) : (
          /* Main Tab Views */
          <>
            {activeTab === 'dashboard' && (
              <OperatorDashboardView
                user={user}
                onSelectRoute={handleSelectRoute}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  setActiveSubView('none');
                }}
              />
            )}

            {activeTab === 'routes' && (
              <OperatorLiveTrackingView
                onBack={() => setActiveTab('dashboard')}
                onOpenPassengerLoad={() => setActiveSubView('passenger_load')}
                routeCode={selectedRoute.code}
                routeName={selectedRoute.name}
              />
            )}

            {activeTab === 'map' && (
              <OperatorDemandMapView onBack={() => setActiveTab('dashboard')} />
            )}

            {activeTab === 'profile' && (
              <OperatorSettingsView
                user={user}
                onLogout={onLogout}
                onBack={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}
      </div>

      {/* Fixed Bottom Navigation Bar (Screens 3-7) - visible when not in deep subview */}
      {activeSubView === 'none' && (
        <nav className="bg-white border-t border-slate-200/90 px-6 py-2 flex items-center justify-around shrink-0 z-30 shadow-xs">
          {/* 1. Dashboard Tab */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setActiveSubView('none');
            }}
            className={`flex flex-col items-center py-1 transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#DC2626] font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Dashboard</span>
          </button>

          {/* 2. Routes Tab */}
          <button
            onClick={() => {
              setActiveTab('routes');
              setActiveSubView('none');
            }}
            className={`flex flex-col items-center py-1 transition cursor-pointer ${
              activeTab === 'routes'
                ? 'text-[#DC2626] font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <RouteIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Routes</span>
          </button>

          {/* 3. Map Tab (Demand Map) */}
          <button
            onClick={() => {
              setActiveTab('map');
              setActiveSubView('none');
            }}
            className={`flex flex-col items-center py-1 transition cursor-pointer ${
              activeTab === 'map'
                ? 'text-[#DC2626] font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Map</span>
          </button>

          {/* 4. Profile / Settings Tab */}
          <button
            onClick={() => {
              setActiveTab('profile');
              setActiveSubView('none');
            }}
            className={`flex flex-col items-center py-1 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#DC2626] font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};
