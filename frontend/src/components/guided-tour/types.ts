export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: TooltipPlacement;
  scrollOptions?: ScrollIntoViewOptions;
}

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';

export interface TourConfig {
  tourId: string;
  pageId: string;
  steps: TourStep[];
  showSkipButton?: boolean;
  showProgress?: boolean;
  spotlightPadding?: number;
  backdropOpacity?: number;
}

export interface TourState {
  tourId: string;
  status: TourStatus;
  currentStep: number;
  completedAt: string | null;
  skippedAt: string | null;
}

export type TourStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}
