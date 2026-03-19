import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TourStep, TourContextType, TourPosition } from './types';
import TourOverlay from './TourOverlay';
import TourTooltip from './TourTooltip';
import { supabase } from '../../../lib/supabase';

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTourInternal = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [tooltipPosition, setTooltipPosition] = useState<TourPosition>('bottom');
  const [seenTours, setSeenTours] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load seen tours from Supabase
        const { data } = await supabase
          .from('user_tour_history')
          .select('tour_id')
          .eq('user_id', user.id);
        
        if (data) {
          setSeenTours(new Set(data.map((t: any) => t.tour_id)));
        }
      }
    };
    checkUser();
  }, []);

  const startTour = useCallback((newSteps: TourStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      stopTour();
    }
  }, [currentStep, steps.length, stopTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const setStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  }, [steps.length]);

  const hasSeenTour = useCallback((tourId: string) => {
    return seenTours.has(tourId);
  }, [seenTours]);

  const markTourSeen = useCallback(async (tourId: string) => {
    if (!userId) return;
    
    // Optimistic update
    setSeenTours(prev => new Set([...prev, tourId]));

    const { error } = await supabase
      .from('user_tour_history')
      .upsert({ user_id: userId, tour_id: tourId, completed_at: new Date().toISOString() });
    
    if (error) {
      console.error('Error marking tour as seen:', error);
    }
  }, [userId]);

  // Update tooltip position based on the current step target
  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const timer = setTimeout(() => {
      const step = steps[currentStep];
      const element = document.querySelector(step.selector);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const pos = step.position || 'bottom';
      setTooltipPosition(pos);

      const offset = step.offset || { x: 0, y: 0 };
      const padding = 12;

      let top = 0;
      let left = 0;

      switch (pos) {
        case 'top':
          top = rect.top - padding;
          left = rect.left + rect.width / 2;
          setTooltipStyle({
            top: `${top}px`,
            left: `${left}px`,
            transform: `translate(-50%, -100%) translate(${offset.x}px, ${offset.y}px)`
          });
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2;
          setTooltipStyle({
            top: `${top}px`,
            left: `${left}px`,
            transform: `translate(-50%, 0) translate(${offset.x}px, ${offset.y}px)`
          });
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - padding;
          setTooltipStyle({
            top: `${top}px`,
            left: `${left}px`,
            transform: `translate(-100%, -50%) translate(${offset.x}px, ${offset.y}px)`
          });
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + padding;
          setTooltipStyle({
            top: `${top}px`,
            left: `${left}px`,
            transform: `translate(0, -50%) translate(${offset.x}px, ${offset.y}px)`
          });
          break;
        case 'center':
          setTooltipStyle({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          });
          break;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, steps]);

  const contextValue = useMemo(() => ({
    currentStep,
    isOpen,
    steps,
    startTour,
    stopTour,
    nextStep,
    prevStep,
    setStep,
    hasSeenTour,
    markTourSeen,
  }), [currentStep, isOpen, steps, startTour, stopTour, nextStep, prevStep, setStep, hasSeenTour, markTourSeen]);

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {isOpen && steps[currentStep] && (
        <>
          <TourOverlay selector={steps[currentStep].selector} />
          {createPortal(
            <TourTooltip
              step={steps[currentStep]}
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={stopTour}
              position={tooltipPosition}
              style={tooltipStyle}
            />,
            document.body
          )}
        </>
      )}
    </TourContext.Provider>
  );
};
