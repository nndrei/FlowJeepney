import React from 'react';
import { AuthUser } from '../../types/auth';

interface OperatorBlankScreenProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const OperatorBlankScreen: React.FC<OperatorBlankScreenProps> = ({ onLogout }) => {
  return (
    <div className="w-full h-full min-h-screen bg-white relative">
      {/* Discreet logout button in top-right for session reset during testing */}
      <button
        type="button"
        onClick={onLogout}
        className="absolute top-4 right-4 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer px-2 py-1"
      >
        Log Out
      </button>
    </div>
  );
};
