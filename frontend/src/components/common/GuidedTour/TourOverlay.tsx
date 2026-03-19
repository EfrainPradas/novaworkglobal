import React, { useEffect, useState, useCallback } from 'react';

interface TourOverlayProps {
  selector: string;
  padding?: number;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ selector, padding = 8 }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const element = document.querySelector(selector);
    if (element) {
      setRect(element.getBoundingClientRect());
      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selector]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [updateRect]);

  if (!rect) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-[1px] transition-opacity duration-300" />
    );
  }

  const { left, top, width, height } = rect;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={left - padding}
              y={top - padding}
              width={width + padding * 2}
              height={height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto backdrop-blur-[1px] transition-all duration-300"
        />
      </svg>
    </div>
  );
};

export default TourOverlay;
