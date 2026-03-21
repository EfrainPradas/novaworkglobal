import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TourStep, TooltipPlacement, SpotlightRect } from './types';

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  spotlightRect: SpotlightRect;
  showSkipButton?: boolean;
  showProgress?: boolean;
  isFirst: boolean;
  isLast: boolean;
  onKeyboardNav?: (direction: 'next' | 'prev' | 'close') => void;
}

const PADDING = 16;
const GAP = 12;

const calculatePosition = (
  spotlightRect: SpotlightRect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferredPlacement: TooltipPlacement
): { top: number; left: number; arrowSide: 'top' | 'bottom' | 'left' | 'right' } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let top = 0;
  let left = 0;
  let arrowSide: 'top' | 'bottom' | 'left' | 'right' = 'top';

  const targetCenterX = spotlightRect.left + spotlightRect.width / 2;
  const targetCenterY = spotlightRect.top + spotlightRect.height / 2;

  const placements: TooltipPlacement[] = [preferredPlacement];
  
  if (preferredPlacement.includes('top')) {
    placements.push('bottom', 'bottom-start', 'bottom-end');
  } else if (preferredPlacement.includes('bottom')) {
    placements.push('top', 'top-start', 'top-end');
  } else if (preferredPlacement.includes('left')) {
    placements.push('right');
  } else if (preferredPlacement.includes('right')) {
    placements.push('left');
  }
  
  placements.push('bottom', 'top', 'right', 'left');

  for (const placement of placements) {
    let testTop = 0;
    let testLeft = 0;

    if (placement === 'top' || placement === 'top-start' || placement === 'top-end') {
      testTop = spotlightRect.top - tooltipHeight - GAP;
      arrowSide = 'bottom';
    } else if (placement === 'bottom' || placement === 'bottom-start' || placement === 'bottom-end') {
      testTop = spotlightRect.top + spotlightRect.height + GAP;
      arrowSide = 'top';
    } else if (placement === 'left') {
      testTop = targetCenterY - tooltipHeight / 2;
      arrowSide = 'right';
    } else if (placement === 'right') {
      testTop = targetCenterY - tooltipHeight / 2;
      arrowSide = 'left';
    }

    if (placement === 'bottom' || placement === 'top') {
      testLeft = targetCenterX - tooltipWidth / 2;
    } else if (placement === 'bottom-start' || placement === 'top-start') {
      testLeft = spotlightRect.left;
    } else if (placement === 'bottom-end' || placement === 'top-end') {
      testLeft = spotlightRect.left + spotlightRect.width - tooltipWidth;
    } else if (placement === 'left') {
      testLeft = spotlightRect.left - tooltipWidth - GAP;
    } else if (placement === 'right') {
      testLeft = spotlightRect.left + spotlightRect.width + GAP;
    }

    const fitsHorizontally = testLeft >= PADDING && testLeft + tooltipWidth <= viewportWidth - PADDING;
    const fitsVertically = testTop >= PADDING && testTop + tooltipHeight <= viewportHeight - PADDING;

    if (fitsHorizontally && fitsVertically) {
      top = testTop;
      left = testLeft;
      break;
    }

    if (top === 0 && left === 0) {
      top = testTop;
      left = Math.max(PADDING, Math.min(testLeft, viewportWidth - tooltipWidth - PADDING));
      
      if (testTop < PADDING) {
        top = spotlightRect.top + spotlightRect.height + GAP;
        arrowSide = 'top';
      } else if (testTop + tooltipHeight > viewportHeight - PADDING) {
        top = spotlightRect.top - tooltipHeight - GAP;
        arrowSide = 'bottom';
      }
    }
  }

  if (left < PADDING) left = PADDING;
  if (left + tooltipWidth > viewportWidth - PADDING) {
    left = viewportWidth - tooltipWidth - PADDING;
  }
  if (top < PADDING) top = PADDING;
  if (top + tooltipHeight > viewportHeight - PADDING) {
    top = viewportHeight - tooltipHeight - PADDING;
  }

  return { top, left, arrowSide };
};

export const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onClose,
  spotlightRect,
  showSkipButton = true,
  showProgress = true,
  isFirst,
  isLast,
}) => {
  const { t } = useTranslation();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getStepTitle = () => step.title.startsWith('tour.') ? t(step.title) : step.title;
  const getStepContent = () => step.content.startsWith('tour.') ? t(step.content) : step.content;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { onNext(); }
    else if (e.key === 'ArrowLeft' && !isFirst) { onPrev(); }
  }, [onClose, onNext, onPrev, isFirst]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const [dimensions, setDimensions] = useState({ width: 340, height: 200 });
  const [position, setPosition] = useState<{ top: number; left: number; arrowSide: 'top' | 'bottom' | 'left' | 'right' }>({ 
    top: 100, 
    left: 100, 
    arrowSide: 'top' 
  });
  const [isReady, setIsReady] = useState(false);

  const placement = step.placement || 'bottom';

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setDimensions({
        width: rect.width || 340,
        height: rect.height || 200,
      });
      setIsReady(true);
    }
  }, [step.id, step.title, step.content]);

  useEffect(() => {
    if (isReady) {
      const newPosition = calculatePosition(spotlightRect, dimensions.width, dimensions.height, placement);
      setPosition(newPosition);
    }
  }, [spotlightRect, dimensions, placement, isReady]);

  const showArrowTop = position.arrowSide === 'top';
  const showArrowBottom = position.arrowSide === 'bottom';
  const showArrowLeft = position.arrowSide === 'left';
  const showArrowRight = position.arrowSide === 'right';

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed z-[9999] w-[340px] max-w-[calc(100vw-2rem)]"
        style={{
          top: position.top,
          left: position.left,
          pointerEvents: 'auto',
        }}
      >
        <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-visible">
          {showArrowTop && (
            <div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700"
            />
          )}
          {showArrowBottom && (
            <div 
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700"
            />
          )}
          {showArrowLeft && (
            <div 
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800 border-t border-r border-gray-200 dark:border-gray-700"
            />
          )}
          {showArrowRight && (
            <div 
              className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800 border-b border-l border-gray-200 dark:border-gray-700"
            />
          )}

          <div className="p-5 relative z-10">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                {showProgress && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                      {t('tour.common.stepOf', { current: stepIndex + 1, total: totalSteps, defaultValue: `Step ${stepIndex + 1} of ${totalSteps}` })}
                    </span>
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 dark:bg-primary-400 transition-all duration-300"
                        style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                  {getStepTitle()}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1 -mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
              {getStepContent()}
            </p>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={onPrev}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('tour.common.back', 'Back')}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {showSkipButton && !isLast && (
                  <button
                    onClick={onSkip}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('tour.common.skip', 'Skip tour')}
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm font-semibold text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors rounded-lg shadow-sm min-w-[80px] justify-center"
                >
                  <span>{isLast ? t('tour.common.done', 'Done') : t('tour.common.next', 'Next')}</span>
                  {!isLast && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TourTooltip;
