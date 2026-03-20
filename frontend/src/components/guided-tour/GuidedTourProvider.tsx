import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { TourConfig, TourStep, TourState, TourStatus, SpotlightRect } from './types';
import { supabase } from '../../lib/supabase';

const COMPLETED_TOURS_KEY = 'nova_completed_tours';

interface CompletedToursCache {
  [tourId: string]: boolean;
}

interface GuidedTourContextValue {
  isTourActive: boolean;
  currentStep: number;
  currentTour: TourConfig | null;
  spotlightRect: SpotlightRect | null;
  hasCompletedTour: (tourId: string) => Promise<boolean>;
  startTour: (tour: TourConfig) => void;
  stopTour: (status?: TourStatus) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
}

const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);

export const useGuidedTour = () => {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error('useGuidedTour must be used within a GuidedTourProvider');
  }
  return context;
};

interface GuidedTourProviderProps {
  children: React.ReactNode;
}

const getCompletedToursCache = (): CompletedToursCache => {
  try {
    const cached = localStorage.getItem(COMPLETED_TOURS_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const setTourCompletedInCache = (tourId: string, completed: boolean) => {
  try {
    const cache = getCompletedToursCache();
    cache[tourId] = completed;
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors
  }
};

export const GuidedTourProvider: React.FC<GuidedTourProviderProps> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTour, setCurrentTour] = useState<TourConfig | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const animationFrameRef = useRef<number>();

  const calculateSpotlightRect = useCallback((targetSelector: string): SpotlightRect | null => {
    const element = document.querySelector(targetSelector);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const padding = currentTour?.spotlightPadding ?? 8;

    return {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
  }, [currentTour?.spotlightPadding]);

  const updateSpotlight = useCallback(() => {
    if (!isTourActive || !currentTour) {
      setSpotlightRect(null);
      return;
    }

    const step = currentTour.steps[currentStep];
    if (!step) return;

    const rect = calculateSpotlightRect(step.target);
    
    if (rect) {
      if (step.scrollOptions) {
        const element = document.querySelector(step.target);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            ...step.scrollOptions,
          });
        }
      }
    }
    
    setSpotlightRect(rect);
  }, [isTourActive, currentTour, currentStep, calculateSpotlightRect]);

  useEffect(() => {
    if (isTourActive && currentTour) {
      const step = currentTour.steps[currentStep];
      if (step) {
        const element = document.querySelector(step.target);
        if (element && step.scrollOptions) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            ...step.scrollOptions,
          });
        }
        
        setTimeout(() => {
          updateSpotlight();
        }, step.scrollOptions ? 300 : 0);
      }
    }
  }, [isTourActive, currentTour, currentStep, updateSpotlight]);

  useEffect(() => {
    const handleScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateSpotlight);
    };

    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateSpotlight);
    };

    if (isTourActive) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTourActive, updateSpotlight]);

  const hasCompletedTour = useCallback(async (tourId: string): Promise<boolean> => {
    const cache = getCompletedToursCache();
    if (cache[tourId]) {
      return true;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_tour_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('tour_id', tourId)
        .single();

      if (error) {
        return false;
      }
      
      const isCompleted = data?.status === 'completed';
      if (isCompleted) {
        setTourCompletedInCache(tourId, true);
      }
      return isCompleted;
    } catch {
      return false;
    }
  }, []);

  const saveTourState = useCallback(async (tourId: string, status: TourStatus, step: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updates: Partial<TourState> = {
      tourId,
      status,
      currentStep: step,
    };

    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    } else if (status === 'skipped') {
      updates.skippedAt = new Date().toISOString();
    }

    const { error } = await supabase
      .from('user_tour_progress')
      .upsert({
        user_id: user.id,
        tour_id: tourId,
        ...updates,
      }, {
        onConflict: 'user_id,tour_id',
      });

    if (error) {
      console.error('Failed to save tour state:', error);
    }
  }, []);

  const startTour = useCallback((tour: TourConfig) => {
    setCurrentTour(tour);
    setCurrentStep(0);
    setIsTourActive(true);
  }, []);

  const stopTour = useCallback((status: TourStatus = 'skipped') => {
    if (currentTour) {
      if (status === 'completed' || status === 'skipped') {
        setTourCompletedInCache(currentTour.tourId, true);
      }
      saveTourState(currentTour.tourId, status, currentStep);
    }
    setIsTourActive(false);
    setCurrentTour(null);
    setCurrentStep(0);
    setSpotlightRect(null);
  }, [currentTour, currentStep, saveTourState]);

  const nextStep = useCallback(() => {
    if (!currentTour) return;
    
    if (currentStep < currentTour.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      stopTour('completed');
    }
  }, [currentTour, currentStep, stopTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (!currentTour) return;
    if (step >= 0 && step < currentTour.steps.length) {
      setCurrentStep(step);
    }
  }, [currentTour]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentTour ? currentStep === currentTour.steps.length - 1 : false;
  const totalSteps = currentTour?.steps.length ?? 0;

  return (
    <GuidedTourContext.Provider
      value={{
        isTourActive,
        currentStep,
        currentTour,
        spotlightRect,
        hasCompletedTour,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        goToStep,
        isFirstStep,
        isLastStep,
        totalSteps,
      }}
    >
      {children}
    </GuidedTourContext.Provider>
  );
};

export default GuidedTourProvider;
