import { TourConfig } from '../../components/guided-tour';

export const WORK_EXPERIENCE_TOUR_ID = 'work-experience-v1';

export const workExperienceTourConfig: TourConfig = {
  tourId: WORK_EXPERIENCE_TOUR_ID,
  pageId: 'work-experience',
  showSkipButton: true,
  showProgress: true,
  spotlightPadding: 6,
  steps: [
    {
      id: 'back-dashboard',
      target: '[data-tour="back-dashboard"]',
      title: 'tour.workExperience.backDashboard.title',
      content: 'tour.workExperience.backDashboard.content',
      placement: 'bottom-start',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'nav-tabs',
      target: '[data-tour="nav-tabs"]',
      title: 'tour.workExperience.navTabs.title',
      content: 'tour.workExperience.navTabs.content',
      placement: 'bottom',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'section-title',
      target: '[data-tour="section-title"]',
      title: 'tour.workExperience.sectionTitle.title',
      content: 'tour.workExperience.sectionTitle.content',
      placement: 'bottom',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'video-chips',
      target: '[data-tour="video-chips"]',
      title: 'tour.workExperience.videoChips.title',
      content: 'tour.workExperience.videoChips.content',
      placement: 'bottom',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'import-resume',
      target: '[data-tour="import-resume"]',
      title: 'tour.workExperience.importResume.title',
      content: 'tour.workExperience.importResume.content',
      placement: 'top-end',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'add-experience',
      target: '[data-tour="add-experience"]',
      title: 'tour.workExperience.addExperience.title',
      content: 'tour.workExperience.addExperience.content',
      placement: 'top-end',
      scrollOptions: { behavior: 'smooth', block: 'nearest' },
    },
    {
      id: 'experience-list',
      target: '[data-tour="experience-list"]',
      title: 'tour.workExperience.experienceList.title',
      content: 'tour.workExperience.experienceList.content',
      placement: 'top-start',
      scrollOptions: { behavior: 'smooth', block: 'center' },
    },
  ],
};
