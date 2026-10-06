import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { AuthUser } from '../types/auth';
import {
  loginWithCredentials,
  signUpWithCredentials,
  loginWithGoogle,
  createGuestSession,
} from '../services/authService';

interface AuthScreenProps {
  onSuccess: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setErrorMsg('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      let authUser: AuthUser;
      if (mode === 'signup') {
        authUser = await signUpWithCredentials(trimmedIdentifier, password, fullName);
      } else {
        authUser = await loginWithCredentials(trimmedIdentifier, password);
      }
      onSuccess(authUser);
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      if (code.includes('auth/email-already-in-use')) {
        setErrorMsg('This email is already registered. Please log in instead.');
      } else if (code.includes('auth/weak-password')) {
        setErrorMsg('Password should be at least 6 characters.');
      } else if (
        code.includes('auth/invalid-credential') ||
        code.includes('auth/wrong-password') ||
        code.includes('auth/user-not-found')
      ) {
        setErrorMsg('Invalid email or password. Please check your credentials.');
      } else if (code.includes('auth/invalid-email')) {
        setErrorMsg('Please enter a valid email address.');
      } else if (code.includes('auth/too-many-requests')) {
        setErrorMsg('Too many failed attempts. Please try again later.');
      } else {
        setErrorMsg('Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const authUser = await loginWithGoogle();
      onSuccess(authUser);
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      if (code.includes('auth/popup-closed-by-user')) {
        // User closed popup without signing in; reset quietly
      } else if (code.includes('auth/popup-blocked')) {
        setErrorMsg('Google sign-in popup was blocked. Please enable popups for this site.');
      } else if (code.includes('auth/unauthorized-domain')) {
        setErrorMsg('This domain is not authorized in Firebase Console (Authentication > Settings > Authorized Domains).');
      } else if (code.includes('auth/cancelled-popup-request')) {
        // Concurrent popup request cancelled; ignore
      } else {
        setErrorMsg('Unable to complete Google sign-in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    const guestUser = createGuestSession();
    onSuccess(guestUser);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-white overflow-y-auto no-scrollbar px-5 sm:px-7 py-3 sm:py-5 relative select-none">
      {/* Centered Form Container */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center items-center py-1">
        {/* FlowJeep Logo: Clean Transparent PNG from public/assets */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex justify-center mb-3 sm:mb-4 shrink-0"
        >
          <img
            src="/assets/01_flowjeep_logo_exact.png"
            alt="FlowJeep Logo"
            className="w-[200px] sm:w-[238px] h-auto max-h-16 sm:max-h-[72px] object-contain select-none pointer-events-none drop-shadow-xs"
          />
        </motion.div>

        {/* Headings */}
        <motion.div
          key={mode + '-headings'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-center mb-3 sm:mb-4 w-full shrink-0"
        >
          <h1 className="text-[20px] sm:text-[23px] font-bold text-[#1E293B] tracking-tight leading-tight">
            {mode === 'login' ? 'Welcome back!' : 'Create an account'}
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#64748B] mt-0.5 font-normal">
            {mode === 'login' ? 'Log in to continue' : 'Sign up to start tracking jeepneys'}
          </p>
        </motion.div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-2.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl text-center"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="w-full space-y-2.5 sm:space-y-3">
          <AnimatePresence mode="popLayout">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full"
              >
                <div className="flex items-center px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-red-100 transition-all">
                  <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 mr-2.5 sm:mr-3 shrink-0" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-transparent text-[14.5px] sm:text-[15px] text-[#1E293B] placeholder-[#94A3B8] outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email or Phone Input */}
          <div className="flex items-center px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-red-100 transition-all">
            <Mail className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 mr-2.5 sm:mr-3 shrink-0" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Phone Number"
              className="w-full bg-transparent text-[14.5px] sm:text-[15px] text-[#1E293B] placeholder-[#94A3B8] outline-none"
              autoComplete="username"
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-red-100 transition-all">
            <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 mr-2.5 sm:mr-3 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent text-[14.5px] sm:text-[15px] text-[#1E293B] placeholder-[#94A3B8] outline-none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Eye className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
            </button>
          </div>

          {/* Log In / Sign Up Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 mt-1 sm:mt-1.5 bg-[#DC2626] hover:bg-[#C81E1E] active:scale-[0.99] text-white font-semibold text-[15px] sm:text-[16px] rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? (
              'Log In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* "or" Divider */}
        <div className="w-full my-2.5 sm:my-3.5 flex items-center justify-center relative">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute bg-white px-2.5 text-[12px] sm:text-[13px] text-slate-400 font-medium">
            or
          </span>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-2.5 sm:py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs flex items-center justify-center space-x-2.5 sm:space-x-3 cursor-pointer group"
        >
          {/* Authentic Google Multi-color G Icon */}
          <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="text-[#334155] font-medium text-[14.5px] sm:text-[15px] group-hover:text-slate-900 transition-colors">
            Continue with Google
          </span>
        </button>

        {/* Secondary "or" Divider */}
        <div className="w-full my-2 sm:my-2.5 flex items-center justify-center relative">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute bg-white px-2 text-[11.5px] sm:text-[12px] text-slate-400 font-medium">
            or
          </span>
        </div>

        {/* Continue as Guest Button (Visually Secondary) */}
        <button
          type="button"
          onClick={handleContinueAsGuest}
          disabled={isLoading}
          className="w-full py-2 sm:py-2.5 px-4 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-2xs flex items-center justify-center cursor-pointer text-[#475569] hover:text-[#1E293B] font-medium text-[13.5px] sm:text-[14.5px]"
        >
          Continue as Guest
        </button>
      </div>

      {/* Footer: Don't have an account? Sign Up */}
      <div className="pt-2 sm:pt-3 pb-1 text-center text-[13.5px] sm:text-[14px] text-[#64748B] shrink-0">
        {mode === 'login' ? (
          <>
            <span>Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className="font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors cursor-pointer hover:underline"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className="font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors cursor-pointer hover:underline"
            >
              Log In
            </button>
          </>
        )}
      </div>
    </div>
  );
};
