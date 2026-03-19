import { ReactNode } from 'react';

export type TourPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  selector: string;
  title: string;
  content: string | ReactNode;
  position?: TourPosition;
  offset?: { x: number; y: number };
}

export interface TourContextType {
  currentStep: number;
  isOpen: boolean;
  steps: TourStep[];
  startTour: (steps: TourStep[]) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (index: number) => void;
  hasSeenTour: (tourId: string) => boolean;
  markTourSeen: (tourId: string) => Promise<void>;
}
