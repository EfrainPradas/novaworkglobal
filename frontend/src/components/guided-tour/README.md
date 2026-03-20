# Guided Tour System

A reusable, production-ready guided help/product tour system for React applications with spotlight highlighting, tooltip positioning, and Supabase persistence.

## Features

- **Spotlight Highlight**: Dark overlay with animated border around target elements
- **Smart Tooltip Positioning**: Automatically adjusts position based on viewport
- **Progress Indicator**: Visual progress bar showing current step
- **State Persistence**: Supabase-backed tour completion tracking per user
- **Auto-start**: Automatically shows tour on first visit
- **Replay Capability**: Help button allows users to restart tour anytime
- **Scroll Handling**: Automatically scrolls to target elements
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode Support**: Fully styled for dark themes

## File Structure

```
src/
├── components/
│   └── guided-tour/
│       ├── index.ts              # Barrel exports
│       ├── types.ts              # TypeScript interfaces
│       ├── GuidedTourProvider.tsx # Context provider
│       ├── GuidedTour.tsx        # Main tour overlay component
│       ├── TourTooltip.tsx       # Tooltip card component
│       └── TourTriggerButton.tsx # Help button trigger
├── config/
│   └── tours/
│       ├── index.ts              # Barrel exports
│       ├── workExperienceTour.ts # Work Experience page tour
│       └── templateTour.ts       # Template for new tours
└── pages/
    └── resume-builder/
        └── WorkExperienceBuilder.tsx  # Integration example
```

## Usage

### 1. Add Provider to App

Wrap your app with the `GuidedTourProvider`:

```tsx
// App.tsx
import { GuidedTourProvider } from './components/guided-tour'
import { GuidedTour } from './components/guided-tour'

function App() {
  return (
    <GuidedTourProvider>
      <GuidedTour />
      {/* Your app content */}
    </GuidedTourProvider>
  )
}
```

### 2. Configure Tour Steps

Create a tour configuration file:

```tsx
// config/tours/myPageTour.ts
import { TourConfig } from '../../components/guided-tour'

export const myPageTourConfig: TourConfig = {
  tourId: 'my-page-v1',
  pageId: 'my-page',
  showSkipButton: true,
  showProgress: true,
  spotlightPadding: 6,
  steps: [
    {
      id: 'step-1',
      target: '[data-tour="element-1"]', // CSS selector
      title: 'Feature Title',
      content: 'Description of what this element does.',
      placement: 'bottom', // tooltip position
      scrollOptions: { behavior: 'smooth', block: 'nearest' }
    },
    // ... more steps
  ]
}
```

### 3. Add Data Attributes

Add `data-tour` attributes to elements you want to highlight:

```tsx
<button data-tour="element-1" onClick={handleClick}>
  My Button
</button>
```

### 4. Integrate with Page Component

```tsx
import { useGuidedTour, TourTriggerButton } from '../../components/guided-tour'
import { myPageTourConfig } from '../../config/tours/myPageTour'

export const MyPage = () => {
  const { startTour, hasCompletedTour } = useGuidedTour()
  const [tourStarted, setTourStarted] = useState(false)

  useEffect(() => {
    checkUserAndStartTour()
  }, [])

  const checkUserAndStartTour = async () => {
    const completed = await hasCompletedTour(myPageTourConfig.tourId)
    if (!completed && !tourStarted) {
      setTourStarted(true)
      setTimeout(() => startTour(myPageTourConfig), 800)
    }
  }

  return (
    <div>
      <div className="flex justify-between">
        <button data-tour="element-1">Back</button>
        <TourTriggerButton 
          tour={myPageTourConfig}
          onStartTour={startTour}
        />
      </div>
      {/* Page content with data-tour attributes */}
    </div>
  )
}
```

## Supabase Setup

Run the migration to create the tour progress table:

```sql
-- supabase/migrations/20260320000001_create_user_tour_progress.sql
CREATE TABLE IF NOT EXISTS user_tour_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    current_step INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_tour UNIQUE (user_id, tour_id)
);
```

## Tour Step Microcopy Guidelines

- **Title**: 3-6 words, action-oriented
- **Content**: 1-2 sentences, explain purpose not mechanics
- **Placement**: Position tooltip away from cursor path
- **Keep it brief**: Users should complete tour in under 60 seconds

### Example Microcopy

**Good:**
- "Return to Dashboard" / "Head back to your dashboard to access other sections."
- "Add Experience" / "Manually add your work history. Capture the company, your title, dates, and key accomplishments."

**Bad:**
- "Back Button" / "This is the back button. Click it to go back."
- "Click the Add button" / "To add a new item, click the Add button located on the right side of the screen."

## API Reference

### TourConfig

```typescript
interface TourConfig {
  tourId: string          // Unique identifier for this tour
  pageId: string          // Page identifier
  steps: TourStep[]       // Array of tour steps
  showSkipButton?: boolean    // Show "Skip tour" (default: true)
  showProgress?: boolean      // Show step progress (default: true)
  spotlightPadding?: number   // Padding around highlighted element (default: 6)
  backdropOpacity?: number    // Dark overlay opacity (default: 0.6)
}
```

### TourStep

```typescript
interface TourStep {
  id: string                    // Unique step identifier
  target: string                // CSS selector for target element
  title: string                // Step title
  content: string               // Step description
  placement?: TooltipPlacement  // Tooltip position
  scrollOptions?: ScrollIntoViewOptions  // Scroll behavior
}
```

### TooltipPlacement

```typescript
type TooltipPlacement = 
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end'
  | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end'
  | 'right-start' | 'right-end'
```

## Best Practices

1. **Limit to 5-7 steps**: Longer tours have lower completion rates
2. **Test all steps**: Verify targets exist and tooltip positions work
3. **Use consistent IDs**: `section-action` pattern works well
4. **Handle missing elements**: Tour continues if target not found
5. **Mobile consideration**: Tooltip repositions if it would overflow viewport
