import { TourConfig } from '../../components/guided-tour';

export const createTourConfig = (
  tourId: string,
  pageId: string,
  steps: Array<{
    id: string;
    target: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
  }>
): TourConfig => ({
  tourId,
  pageId,
  showSkipButton: true,
  showProgress: true,
  spotlightPadding: 6,
  steps: steps.map(step => ({
    ...step,
    scrollOptions: { behavior: 'smooth', block: 'nearest' },
  })),
});

export const TEMPLATE_TOUR_ID = 'template-tour-v1';

export const templateTourConfig: TourConfig = {
  tourId: TEMPLATE_TOUR_ID,
  pageId: 'template-page',
  showSkipButton: true,
  showProgress: true,
  spotlightPadding: 6,
  steps: [
    {
      id: 'step-1',
      target: '[data-tour="element-1"]',
      title: 'Step 1 Title',
      content: 'Describe what this element does and why it matters.',
      placement: 'bottom',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'step-2',
      target: '[data-tour="element-2"]',
      title: 'Step 2 Title',
      content: 'Explain the second step of the process.',
      placement: 'right',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'step-3',
      target: '[data-tour="element-3"]',
      title: 'Step 3 Title',
      content: 'Guide users to the final action.',
      placement: 'top',
      scrollOptions: { behavior: 'smooth', block: 'center' },
    },
  ],
};
