import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuidedTour } from './GuidedTourProvider';
import { TourTooltip } from './TourTooltip';

export const GuidedTour: React.FC = () => {
  const {
    isTourActive,
    currentStep,
    currentTour,
    spotlightRect,
    nextStep,
    prevStep,
    stopTour,
    isFirstStep,
    isLastStep,
    totalSteps,
  } = useGuidedTour();

  if (!isTourActive || !currentTour || !spotlightRect) {
    return null;
  }

  const currentStepData = currentTour.steps[currentStep];

  if (!currentStepData) {
    return null;
  }

  const backdropOpacity = currentTour.backdropOpacity ?? 0.6;
  const springTransition = { type: 'spring', stiffness: 300, damping: 30 };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9998]"
        style={{ pointerEvents: 'none' }}
      >
        {/* Clickable backdrop outside spotlight */}
        <div
          className="absolute inset-0"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={() => stopTour('skipped')}
        />

        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <motion.rect
                animate={{
                  x: spotlightRect.left,
                  y: spotlightRect.top,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                }}
                transition={springTransition}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`rgba(0, 0, 0, ${backdropOpacity})`}
            mask="url(#tour-spotlight-mask)"
          />
          <motion.rect
            animate={{
              x: spotlightRect.left,
              y: spotlightRect.top,
              width: spotlightRect.width,
              height: spotlightRect.height,
              opacity: 1,
            }}
            initial={{ opacity: 0 }}
            transition={springTransition}
            rx="8"
            fill="transparent"
            stroke="var(--primary-500, #1F5BAA)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="dark:stroke-primary-400"
          />
        </svg>

        <motion.div
          animate={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
          transition={springTransition}
          className="absolute"
          style={{
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(31, 91, 170, 0.2)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>

      <TourTooltip
        key={currentStepData.id}
        step={currentStepData}
        stepIndex={currentStep}
        totalSteps={totalSteps}
        spotlightRect={spotlightRect}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={() => stopTour('skipped')}
        onClose={() => stopTour('skipped')}
        showSkipButton={currentTour.showSkipButton}
        showProgress={currentTour.showProgress}
        isFirst={isFirstStep}
        isLast={isLastStep}
      />
    </AnimatePresence>
  );
};

export default GuidedTour;
