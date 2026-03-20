import { TourConfig } from '../../components/guided-tour';

export const RESUME_BUILDER_MENU_TOUR_ID = 'resume-builder-menu-v1';

export const resumeBuilderMenuTourConfig: TourConfig = {
  tourId: RESUME_BUILDER_MENU_TOUR_ID,
  pageId: 'resume-builder-menu',
  showSkipButton: true,
  showProgress: true,
  spotlightPadding: 8,
  steps: [
    {
      id: 'step-1',
      target: '[data-tour="resume-step-1"]',
      title: 'tour.resumeBuilderMenu.steps.1.title',
      content: 'tour.resumeBuilderMenu.steps.1.content',
      placement: 'bottom-start',
      scrollOptions: { behavior: 'smooth', block: 'center' },
    },
    {
      id: 'step-2',
      target: '[data-tour="resume-step-2"]',
      title: 'tour.resumeBuilderMenu.steps.2.title',
      content: 'tour.resumeBuilderMenu.steps.2.content',
      placement: 'bottom-start',
      scrollOptions: { behavior: 'smooth', block: 'center' },
    },
    {
      id: 'step-3',
      target: '[data-tour="resume-step-3"]',
      title: 'tour.resumeBuilderMenu.steps.3.title',
      content: 'tour.resumeBuilderMenu.steps.3.content',
      placement: 'bottom-start',
      scrollOptions: { behavior: 'smooth', block: 'center' },
    },
    {
      id: 'step-4',
      target: '[data-tour="resume-step-4"]',
      title: 'tour.resumeBuilderMenu.steps.4.title',
      content: 'tour.resumeBuilderMenu.steps.4.content',
      placement: 'top-start',
      scrollOptions: { behavior: 'smooth', block: 'center' },
    },
  ],
};
