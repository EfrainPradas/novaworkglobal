import { useTourInternal } from '../components/common/GuidedTour/TourProvider';

export const useTour = () => {
  const { 
    startTour, 
    stopTour, 
    nextStep, 
    prevStep, 
    setStep, 
    currentStep, 
    isOpen, 
    hasSeenTour, 
    markTourSeen 
  } = useTourInternal();

  return {
    startTour,
    stopTour,
    nextStep,
    prevStep,
    setStep,
    currentStep,
    isOpen,
    hasSeenTour,
    markTourSeen
  };
};
