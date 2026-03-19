import React from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { TourStep, TourPosition } from './types';

interface TourTooltipProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  position: TourPosition;
  style: React.CSSProperties;
}

const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position,
  style
}) => {
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className={`fixed z-[100] w-72 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 transition-all duration-300 animate-in fade-in zoom-in-95`}
      style={style}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
        {step.title}
      </h3>
      
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
        {step.content}
      </div>


      <div className="flex items-center justify-between mt-auto">
        <button
          onClick={onSkip}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Skip tour
        </button>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={onPrev}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white rounded-lg shadow-md transition-all font-semibold text-sm"
          >
            {isLast ? (
              <>
                <span>Done</span>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Triangle Arrow */}
      {/* This is a bit tricky with dynamic positioning, but we can add classes based on 'position' */}
      <div 
        className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transform rotate-45
          ${position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
          ${position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
          ${position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-r border-t' : ''}
          ${position === 'right' ? 'left-[-6px] top-1/2 -translate-y-1/2 border-l border-b' : ''}
        `}
      />
    </div>
  );
};

export default TourTooltip;
