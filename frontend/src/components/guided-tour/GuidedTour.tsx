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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9998] pointer-events-none"
      >
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
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
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#tour-spotlight-mask)"
            className="dark:fill-black/70"
          />
          <motion.rect
            x={spotlightRect.left}
            y={spotlightRect.top}
            width={spotlightRect.width}
            height={spotlightRect.height}
            rx="8"
            fill="transparent"
            stroke="var(--primary-500, #1F5BAA)"
            strokeWidth="2"
            strokeDasharray="4 4"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="dark:stroke-primary-400"
          />
        </svg>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            borderRadius: '8px',
            boxShadow: '0 0 0 4px rgba(31, 91, 170, 0.2)',
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
