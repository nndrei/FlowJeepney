import React from 'react';
import { motion } from 'motion/react';
import { OperatorLogo } from './OperatorLogo';

interface OperatorSplashScreenProps {
  onDismiss?: () => void;
}

export const OperatorSplashScreen: React.FC<OperatorSplashScreenProps> = ({ onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#DC2626] via-[#B91C1C] to-[#7F1D1D] flex flex-col items-center justify-between text-white cursor-pointer select-none"
    >
      {/* Subtle background glow rings */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

      {/* Top spacer */}
      <div className="pt-12 px-6 w-full flex items-center justify-between opacity-80 text-xs">
        <span className="font-medium tracking-wide">Manage. Monitor. Serve.</span>
      </div>

      {/* Center Branding */}
      <div className="flex flex-col items-center z-10 px-6">
        <motion.div
          initial={{ scale: 0.9, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <OperatorLogo variant="white" size="xl" />
        </motion.div>
      </div>

      {/* Bottom City Skyline & Light Waves Silhouette */}
      <div className="w-full relative flex flex-col items-center">
        {/* City Skyline SVG Silhouette */}
        <svg
          viewBox="0 0 400 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-28 object-cover opacity-25 text-black"
        >
          <path
            d="M0 120H400V70H380V85H360V60H345V75H330V40H315V75H300V55H285V80H265V48H250V30H240V48H230V80H210V50H195V65H180V35H170V15H160V35H150V80H135V60H120V75H105V45H90V80H75V55H60V70H45V40H30V85H15V70H0V120Z"
            fill="currentColor"
          />
        </svg>

        {/* Ambient Wave Layer */}
        <div className="w-full h-12 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center pb-3">
          <p className="text-[11px] text-white/60 tracking-wider">
            Tap anywhere to enter
          </p>
        </div>
      </div>
    </motion.div>
  );
};
