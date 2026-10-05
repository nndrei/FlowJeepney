import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CitySkylineGraphic,
  BottomMaroonWave,
  TrackingGraphic,
  PassengerLoadGraphic,
  RouteDemandGraphic,
} from './illustrations/Illustrations';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface SlideData {
  title: string;
  description: string;
  illustration: React.ReactNode;
  buttonText: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  // Screen phase: 'splash' -> slide index (0, 1, 2)
  const [isSplash, setIsSplash] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Touch and mouse drag handling for fluid swiping on both mobile and desktop
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const minSwipeDistance = 45;

  const slides: SlideData[] = [
    {
      title: 'Real-Time Jeepney Tracking',
      description: 'See where your jeepney is, right now.',
      illustration: (
        <img
          src="/assets/ejeep_tracking_illustration_transparent.png"
          alt="Real-Time Tracking"
          className="w-64 h-64 max-h-[30vh] object-contain select-none pointer-events-none"
        />
      ),
      buttonText: 'Next',
    },
    {
      title: 'Check Passenger Load',
      description: 'Know how full your jeepney is before you ride.',
      illustration: (
        <img
          src="/assets/passenger_load_illustration.png"
          alt="Check Passenger Load"
          className="w-60 h-60 max-h-[30vh] object-contain select-none pointer-events-none"
        />
      ),
      buttonText: 'Next',
    },
    {
      title: 'Smarter Routes & Demand Map',
      description: 'Find the best routes and see where demand is highest.',
      illustration: (
        <img
          src="/assets/route_demand_illustration.png"
          alt="Smarter Routes & Demand Map"
          className="w-60 h-60 max-h-[30vh] object-contain select-none pointer-events-none"
        />
      ),
      buttonText: 'Get Started',
    },
  ];

  const handleNext = () => {
    if (isSplash) {
      setIsSplash(false);
      setCurrentSlide(0);
    } else if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (!isSplash) {
      if (currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
      } else {
        // Swiping right on first onboarding slide returns to front splash screen
        setIsSplash(true);
      }
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    pointerStartX.current = e.targetTouches[0].clientX;
    pointerStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pointerStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = pointerStartX.current - endX;
    const deltaY = (pointerStartY.current || endY) - endY;

    // Ensure predominantly horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handleNext(); // swipe left -> forward
      } else {
        handlePrev(); // swipe right -> back
      }
    }
    pointerStartX.current = null;
    pointerStartY.current = null;
  };

  // Mouse drag handlers for desktop preview testing
  const handleMouseDown = (e: React.MouseEvent) => {
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    isDragging.current = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || pointerStartX.current === null) return;
    const deltaX = pointerStartX.current - e.clientX;
    const deltaY = (pointerStartY.current || e.clientY) - e.clientY;

    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    pointerStartX.current = null;
    pointerStartY.current = null;
    isDragging.current = false;
  };

  return (
    <div
      className="relative w-full h-full flex flex-col bg-white overflow-hidden select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <AnimatePresence mode="wait">
        {isSplash ? (
          /* ============================================================ */
          /* SCREEN 0: SPLASH / FRONT PAGE                                */
          /* ============================================================ */
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full h-full flex flex-col justify-between relative cursor-grab active:cursor-grabbing pt-6"
          >
            {/* Central Brand Identity & Exact Logo */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-2 pb-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-center text-center"
              >
                {/* Exact FlowJeep Logo with Mascot and Typography */}
                <img
                  src="/assets/01_flowjeep_logo_exact.png"
                  alt="FlowJeep Logo"
                  className="w-56 sm:w-64 max-w-[80vw] h-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />

                {/* Slogan / Tagline with increased bottom margin for balanced spacing */}
                <div className="mt-3.5 mb-6 sm:mb-8 space-y-1 text-[#526274] font-medium text-[15px] sm:text-[16px] leading-relaxed">
                  <p>Smarter Commutes.</p>
                  <p>A Brighter Tomorrow.</p>
                </div>
              </motion.div>
            </div>

            {/* Bottom Section: Pagination, Tall Skyline & Taller 18-22% Maroon Wave */}
            <div className="relative w-full overflow-hidden mt-auto flex flex-col">
              {/* Splash Pagination Dots: Floating comfortably in clear white space ABOVE the skyline spire */}
              <div className="relative z-20 flex justify-center mb-10">
                <div
                  onClick={handleNext}
                  role="button"
                  tabIndex={0}
                  aria-label="Next slide"
                  className="flex items-center space-x-2 py-1 px-3 cursor-pointer group"
                >
                  {/* Active Maroon Pill */}
                  <span className="w-5 h-1.5 rounded-full bg-gradient-to-r from-[#9E1438] to-[#800020] shadow-sm transition-all group-hover:scale-105" />
                  {/* Inactive Gray Dots */}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] transition-all group-hover:bg-[#94A3B8]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] transition-all group-hover:bg-[#94A3B8]" />
                </div>
              </div>

              {/* City Skyline & Taller Wave container */}
              <div className="relative w-full">
                {/* City Skyline: Scaled taller, sitting deep behind the wave with zero gap */}
                <div className="absolute bottom-0 inset-x-0 w-full px-1 pointer-events-none z-0">
                  <CitySkylineGraphic className="w-full h-44 sm:h-52 opacity-80" />
                </div>

                {/* Taller Asymmetric Maroon Wave: covers ~18-22% of card height */}
                <div className="relative z-10 w-full pointer-events-none -mb-1">
                  <BottomMaroonWave className="w-full h-36 sm:h-44 block" />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ============================================================ */
          /* SCREENS 1 - 3: MULTI-STEP ONBOARDING SLIDES                   */
          /* ============================================================ */
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35 }}
            className="w-full h-full flex flex-col justify-between pt-6"
          >
            {/* Slide Content with Animated Transitions */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full flex flex-col items-center cursor-grab active:cursor-grabbing"
                >
                  {/* Artwork Illustration */}
                  <div className="mb-6 flex items-center justify-center pointer-events-none">
                    {slides[currentSlide].illustration}
                  </div>

                  {/* Slide Title */}
                  <h2 className="text-[22px] font-bold text-neutral-900 tracking-tight leading-snug px-2">
                    {slides[currentSlide].title}
                  </h2>

                  {/* Slide Subtitle */}
                  <p className="mt-2 text-neutral-500 text-[14px] leading-relaxed max-w-[270px]">
                    {slides[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Actions Area */}
            <div className="w-full px-6 pb-8 pt-3 flex flex-col items-center">
              {/* Pagination Dots */}
              <div className="flex items-center space-x-2.5 mb-7" role="tablist">
                {slides.map((_, idx) => {
                  const isActive = idx === currentSlide;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        isActive
                          ? 'w-2.5 h-2.5 bg-[#800020] scale-110'
                          : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Action Button (Maroon) */}
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 px-6 rounded-xl bg-[#800020] hover:bg-[#6c001b] active:scale-[0.98] text-white font-semibold text-[15px] tracking-wide transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center cursor-pointer"
              >
                {slides[currentSlide].buttonText}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
