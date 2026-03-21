import React, { useState } from 'react';
import { HelpCircle, Map, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourConfig } from './types';

interface TourTriggerButtonProps {
  tour?: TourConfig;
  onStartTour: (tour: TourConfig) => void;
  hasCompletedTour?: (tourId: string) => Promise<boolean>;
  className?: string;
}

export const TourTriggerButton: React.FC<TourTriggerButtonProps> = ({
  tour,
  onStartTour,
  className = '',
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStartTour = () => {
    if (tour) {
      onStartTour(tour);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          flex items-center gap-2 px-3 py-2
          bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700
          rounded-lg shadow-md
          text-gray-600 dark:text-gray-300
          hover:text-primary-600 dark:hover:text-primary-400
          hover:border-primary-300 dark:hover:border-primary-600
          transition-all duration-200
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Help</span>
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
            >
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Need help?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Take a guided tour of this page
                </p>
              </div>
              
              {tour && (
                <button
                  onClick={handleStartTour}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                    <Map className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Take the tour
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tour.steps.length} steps
                    </div>
                  </div>
                  <RotateCcw className="w-4 h-4 text-gray-400" />
                </button>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TourTriggerButton;
