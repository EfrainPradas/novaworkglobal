/**
 * CARStoryGuidedPanel — Special guidance panel for CAR Stories.
 * Shows contextual tips, progress, and encouragement alongside CARStoryBuilder.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Star, Target, Zap, TrendingUp, X } from 'lucide-react'
import { useGuidedPath } from '../../contexts/GuidedPathContext'

interface CARStoryGuidedPanelProps {
  storiesCreated?: number
  storiesGoal?: number
}

export default function CARStoryGuidedPanel({
  storiesCreated = 0,
  storiesGoal = 3,
}: CARStoryGuidedPanelProps) {
  const { isGuidedMode } = useGuidedPath()
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  if (!isGuidedMode || dismissed) return null

  const progress = Math.min(100, Math.round((storiesCreated / storiesGoal) * 100))

  // Encouragement messages
  let encouragement = 'Start with your strongest accomplishment'
  if (storiesCreated === 1) encouragement = 'Great start! One story down'
  if (storiesCreated === 2) encouragement = 'Almost there! One more to go'
  if (storiesCreated >= storiesGoal) encouragement = 'Excellent! You\'ve hit your goal'

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={16} style={{ color: '#D97706' }} />
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#92400E',
            fontFamily: 'Montserrat, sans-serif',
          }}>
            CAR Story Guide
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D97706', padding: 2 }}
            aria-label="Dismiss guide"
          >
            <X size={14} />
          </button>
          {expanded ? <ChevronUp size={14} color="#D97706" /> : <ChevronDown size={14} color="#D97706" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px' }}>
              {/* Progress tracker */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 8,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>
                    {storiesCreated} of {storiesGoal} stories
                  </div>
                  <div style={{ height: 4, background: '#FDE68A', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ height: '100%', background: '#D97706', borderRadius: 2 }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#B45309', fontWeight: 500 }}>
                  {encouragement}
                </div>
              </div>

              {/* CAR Framework explanation */}
              <div style={{ fontSize: 12, color: '#78350F', marginBottom: 10, fontWeight: 500 }}>
                The CAR Framework
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, background: '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Target size={12} style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Challenge</div>
                    <div style={{ fontSize: 11, color: '#B45309', lineHeight: 1.4 }}>
                      What problem or situation did you face?
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, background: '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Zap size={12} style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Action</div>
                    <div style={{ fontSize: 11, color: '#B45309', lineHeight: 1.4 }}>
                      What specific steps did you take to address it?
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, background: '#FEF3C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TrendingUp size={12} style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Result</div>
                    <div style={{ fontSize: 11, color: '#B45309', lineHeight: 1.4 }}>
                      What measurable outcome did you achieve?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
