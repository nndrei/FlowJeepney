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
import { seedTestUsers } from './services/seedUsers';

type AppScreen = 'onboarding' | 'auth' | 'main';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowjeep_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Never default to operator automatically on app load
          if (parsed && parsed.role === 'commuter') {
            return parsed;
          }
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  // Default to onboarding; finishing onboarding always leads directly to Auth screen
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');

  // Initialize and seed Firebase Realtime Database test accounts on mount
  useEffect(() => {
    seedTestUsers().catch((err) => {
      console.warn('[App] Test users initialization notice:', err);
    });
  }, []);

  const handleOnboardingComplete = () => {
    // Never jump to operator by default; always present the login screen
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
          currentUser?.role === 'operator' ? (
            <OperatorBlankScreen user={currentUser} onLogout={handleLogout} />
          ) : (
            <MainInterface user={currentUser} onLogout={handleLogout} />
          )
        )}
      </div>
    </main>
  );
}
