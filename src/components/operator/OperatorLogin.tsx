import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { OperatorUser } from './types';

interface OperatorLoginProps {
  onLoginSuccess: (user: OperatorUser) => void;
  onSwitchToCommuter: () => void;
}

export const OperatorLogin: React.FC<OperatorLoginProps> = ({
  onLoginSuccess,
  onSwitchToCommuter,
}) => {
  const [identifier, setIdentifier] = useState('operator@flowjeep.com');
  const [password, setPassword] = useState('flowjeep2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your operator email or phone number');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Please enter your operator password');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const username = identifier.split('@')[0];
      const displayName =
        username.toLowerCase() === 'operator'
          ? 'Driver/Operator'
          : username.charAt(0).toUpperCase() + username.slice(1);

      onLoginSuccess({
        name: displayName,
        email: identifier.includes('@') ? identifier : `${identifier}@flowjeep.com`,
        role: 'operator',
        assignedRouteId: 'route-1',
        assignedPlate: 'NDL-8421',
      });
    }, 500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: 'Driver/Operator',
        email: 'operator@flowjeep.com',
        role: 'operator',
        assignedRouteId: 'route-1',
        assignedPlate: 'NDL-8421',
      });
    }, 500);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white text-slate-800 select-none overflow-y-auto no-scrollbar px-6 sm:px-8 py-5 relative">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between z-10 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Operator Terminal
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E31B23] border border-red-200">
          Authorized Operators Only
        </span>
      </div>

      {/* Main Form Center Block */}
      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center pt-2 pb-4">
        {/* Exact FlowJeep Logo with Speed Trails & Modern Jeepney */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-6"
        >
          {/* Logo Graphic */}
          <div className="w-20 h-16 relative flex items-center justify-center mb-1">
            <img
              src="/assets/01_flowjeep_logo_exact.png"
              alt="FlowJeep Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to SVG if image not found
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center space-x-0.5">
            <span className="text-3xl font-black text-slate-900 tracking-tight">Flow</span>
            <span className="text-3xl font-black text-[#E31B23] tracking-tight">Jeep</span>
          </div>
          <span className="text-sm font-bold text-[#E31B23] tracking-wide mt-0.5">
            Operator Portal
          </span>
        </motion.div>

        {/* Welcome Back Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back!</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Log in to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Email or Phone Number Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Phone Number"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#E31B23] focus:ring-1 focus:ring-[#E31B23] transition-all shadow-2xs"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#E31B23] focus:ring-1 focus:ring-[#E31B23] transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Primary Log In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#E31B23] hover:bg-[#C81017] active:bg-[#B91C1C] text-white text-sm font-bold rounded-2xl shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-2 mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Log In</span>
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => alert('Password reset link sent to registered operator phone/email.')}
              className="text-xs font-semibold text-[#E31B23] hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              or
            </span>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-2xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center space-x-2.5"
          >
            {/* Google Colorful G SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="w-full text-center pb-2 text-[10px] text-slate-400">
        LTFRB Modernized Paratransit Operator Terminal • v2.4
      </div>
    </div>
  );
};
