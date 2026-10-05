import React from 'react';
import { motion } from 'motion/react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface OperatorSplashProps {
  onContinue: () => void;
}

export const OperatorSplash: React.FC<OperatorSplashProps> = ({ onContinue }) => {
  return (
    <div
      onClick={onContinue}
      className="relative w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#E31B23] via-[#DC2626] to-[#991B1B] text-white select-none cursor-pointer overflow-hidden"
    >
      {/* 1. iOS / Mobile Status Bar Header matching image.png */}
      <div className="w-full px-7 pt-3.5 pb-2 flex items-center justify-between z-20 text-white/95 text-xs font-semibold tracking-tight">
        <span>9:41</span>
        <div className="flex items-center space-x-1.5 text-white/90">
          <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
          <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
          <BatteryMedium className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>

      {/* 2. Centered Brand Block matching image.png */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex-1 flex flex-col items-center justify-center -mt-8 z-20 px-6"
      >
        {/* Stylized White Jeepney Icon with Horizontal Speed Trails */}
        <div className="relative mb-4 flex items-center justify-center">
          <svg
            className="w-28 h-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
            viewBox="0 0 120 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Speed trails */}
            <rect x="4" y="24" width="22" height="4.5" rx="2.25" fill="white" fillOpacity="0.95" />
            <rect x="0" y="34" width="30" height="4.5" rx="2.25" fill="white" fillOpacity="0.95" />
            <rect x="8" y="44" width="18" height="4.5" rx="2.25" fill="white" fillOpacity="0.95" />

            {/* Modern Jeepney Body Silhouette */}
            <path
              d="M38 48C38 36.5 45 23 58 23H84C93 23 99 29 101 37L104 49C105 53 102 57 98 57H42C39.8 57 38 55.2 38 53V48Z"
              fill="white"
            />
            {/* Windshield */}
            <path
              d="M58 27H82C87.5 27 91.5 30.5 93 36L94 40H54L56 31C56.5 28.5 57.2 27 58 27Z"
              fill="#B91C1C"
            />
            {/* Headlights */}
            <circle cx="98" cy="48" r="2.5" fill="#B91C1C" />
            <circle cx="83" cy="52" r="2" fill="#B91C1C" />
            {/* Bumper grille */}
            <rect x="87" y="50" width="12" height="2" rx="1" fill="#B91C1C" />

            {/* Front Wheel */}
            <circle cx="88" cy="58" r="7" fill="white" />
            <circle cx="88" cy="58" r="4.5" fill="#7F1D1D" />
            <circle cx="88" cy="58" r="2" fill="white" />

            {/* Rear Wheel */}
            <circle cx="48" cy="58" r="7" fill="white" />
            <circle cx="48" cy="58" r="4.5" fill="#7F1D1D" />
            <circle cx="48" cy="58" r="2" fill="white" />
          </svg>
        </div>

        {/* Brand Text */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-xs font-sans">
          FlowJeep
        </h1>
        <p className="text-base font-medium tracking-wide text-white/95 mt-1.5">
          Operator Portal
        </p>

        {/* Subtle Tap to Continue Indicator */}
        <motion.div
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-8 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-xs text-white/90 font-medium"
        >
          Tap anywhere to continue
        </motion.div>
      </motion.div>

      {/* 3. Bottom City Skyline Silhouette & Crimson Wave Graphic */}
      <div className="relative w-full h-64 shrink-0 z-10 pointer-events-none">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 390 240"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skylineGrad" x1="195" y1="0" x2="195" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4D070D" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#3D060A" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#250406" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="waveGrad1" x1="0" y1="185" x2="390" y2="230" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="50%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0" y1="205" x2="390" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Deep Silhouette Buildings */}
          <rect x="18" y="100" width="34" height="140" fill="url(#skylineGrad)" fillOpacity="0.6" />
          <rect x="58" y="125" width="28" height="115" fill="url(#skylineGrad)" fillOpacity="0.5" />
          <rect x="110" y="90" width="40" height="150" fill="url(#skylineGrad)" fillOpacity="0.65" />
          <rect x="230" y="110" width="36" height="130" fill="url(#skylineGrad)" fillOpacity="0.6" />
          <rect x="290" y="120" width="42" height="120" fill="url(#skylineGrad)" fillOpacity="0.5" />

          {/* Foreground Tower 1 (Left Tall Spire) */}
          <line x1="88" y1="45" x2="88" y2="70" stroke="#3D060A" strokeWidth="2.5" />
          <path d="M78 70L88 55L98 70V240H78V70Z" fill="url(#skylineGrad)" />

          {/* Foreground Tower 2 (Center Skyscraper) */}
          <line x1="185" y1="30" x2="185" y2="58" stroke="#3D060A" strokeWidth="2.5" />
          <rect x="168" y="58" width="34" height="182" rx="1" fill="url(#skylineGrad)" />
          {/* Windows on Center Tower */}
          <rect x="174" y="70" width="4" height="6" fill="#F87171" fillOpacity="0.35" />
          <rect x="182" y="70" width="4" height="6" fill="#F87171" fillOpacity="0.35" />
          <rect x="190" y="70" width="4" height="6" fill="#F87171" fillOpacity="0.35" />
          <rect x="174" y="84" width="4" height="6" fill="#F87171" fillOpacity="0.3" />
          <rect x="182" y="84" width="4" height="6" fill="#F87171" fillOpacity="0.3" />
          <rect x="190" y="84" width="4" height="6" fill="#F87171" fillOpacity="0.3" />
          <rect x="174" y="98" width="4" height="6" fill="#F87171" fillOpacity="0.25" />
          <rect x="182" y="98" width="4" height="6" fill="#F87171" fillOpacity="0.25" />
          <rect x="190" y="98" width="4" height="6" fill="#F87171" fillOpacity="0.25" />

          {/* Foreground Tower 3 (Mid-Right Skyscraper) */}
          <line x1="315" y1="52" x2="315" y2="78" stroke="#3D060A" strokeWidth="2" />
          <rect x="300" y="78" width="30" height="162" fill="url(#skylineGrad)" />

          {/* Mid-Left Block Tower */}
          <rect x="122" y="108" width="38" height="132" fill="url(#skylineGrad)" />
          {/* Right Mid Tower */}
          <rect x="238" y="95" width="42" height="145" fill="url(#skylineGrad)" />

          {/* Bottom Layered Crimson Wave Graphic matching image.png */}
          <path
            d="M0 200C60 186 130 182 200 195C270 208 340 214 390 202V240H0V200Z"
            fill="url(#waveGrad1)"
          />
          <path
            d="M0 214C80 202 160 204 240 216C300 224 360 224 390 218V240H0V214Z"
            fill="url(#waveGrad2)"
          />
        </svg>
      </div>
    </div>
  );
};
