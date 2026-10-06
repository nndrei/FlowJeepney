/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { AuthScreen } from './components/AuthScreen';
import { MainInterface } from './components/MainInterface';
import { OperatorBlankScreen } from './components/operator/OperatorBlankScreen';
import { AuthUser } from './types/auth';
import { logoutUser } from './services/authService';
import { initializeDatabaseDefaults } from './services/databaseService';
type AppScreen = 'onboarding' | 'auth' | 'main';

export default function App() {
  useEffect(() => {
    // Non-destructive initial database configuration
    initializeDatabaseDefaults();
  }, []);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowjeep_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.role === 'commuter' || parsed.isGuest || parsed.role === 'driver' || parsed.role === 'admin')) {
            return parsed;
          }
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  // Preserve session if already stored in localStorage; otherwise start on onboarding
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowjeep_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.role === 'commuter' || parsed.isGuest || parsed.role === 'driver' || parsed.role === 'admin')) {
            return 'main';
          }
        } catch {
          // ignore
        }
      }
    }
    return 'onboarding';
  });

  const handleOnboardingComplete = () => {
    setCurrentScreen('auth');
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('flowjeep_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    setCurrentScreen('main');
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentScreen('auth');
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-white sm:bg-neutral-100 p-0 sm:p-4">
      {/* 
        Mobile screens: Full screen edge-to-edge (100dvh).
        Tablet & Desktop screens: Centered mobile phone portrait container with light gray border.
      */}
      <div
        className="w-full h-[100dvh] sm:h-[844px] sm:max-h-[92vh] sm:max-w-[390px] rounded-none sm:rounded-[44px] bg-white border border-neutral-300 sm:shadow-lg overflow-hidden no-scrollbar flex flex-col relative"
        role="region"
        aria-label="FlowJeep Mobile Viewport"
      >
        {currentScreen === 'onboarding' && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen onSuccess={handleAuthSuccess} />
        )}

        {currentScreen === 'main' && (
          (currentUser?.role === 'admin' || currentUser?.role === 'driver' || currentUser?.role === 'operator') ? (
            <OperatorBlankScreen user={currentUser} onLogout={handleLogout} />
          ) : (
            <MainInterface user={currentUser} onLogout={handleLogout} />
          )
        )}
      </div>
    </main>
  );
}
