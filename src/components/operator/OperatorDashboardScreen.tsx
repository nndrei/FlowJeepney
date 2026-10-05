import React from 'react';
import { OperatorUser } from './types';
import { OperatorDashboardView } from './OperatorDashboardView';

interface OperatorDashboardScreenProps {
  user: OperatorUser;
  onNavigateToTracking: (routeId: string) => void;
  onNavigateToSettings: () => void;
}

export const OperatorDashboardScreen: React.FC<OperatorDashboardScreenProps> = ({
  user,
  onNavigateToTracking,
  onNavigateToSettings,
}) => {
  return (
    <OperatorDashboardView
      user={user}
      onSelectRoute={onNavigateToTracking}
      onNavigateTab={(tab) => {
        if (tab === 'profile') {
          onNavigateToSettings();
        } else if (tab === 'routes') {
          onNavigateToTracking('route-1');
        }
      }}
    />
  );
};
