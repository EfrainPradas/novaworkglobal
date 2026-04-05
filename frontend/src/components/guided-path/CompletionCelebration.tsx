/**
 * CompletionCelebration — Path completion overlay.
 * CSS-based confetti animation + summary + CTA.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PartyPopper, FileCheck, ArrowRight } from 'lucide-react'

interface CompletionCelebrationProps {
  onDismiss?: () => void
}

// Lightweight confetti particles
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const left = Math.random() * 100
  const size = 4 + Math.random() * 6
  const duration = 2 + Math.random() * 2

  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
      animate={{
        y: 400,
        x: (Math.random() - 0.5) * 200,
        opacity: 0,
        rotate: Math.random() * 720,
      }}
      transition={{ duration, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: 0,
        left: `${left}%`,
        width: size,
        height: size * 1.5,
        background: color,
        borderRadius: 2,
        pointerEvents: 'none',
      }}
    />
  )
}

const CONFETTI_COLORS = ['#1F5BAA', '#4DA8DA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function CompletionCelebration({ onDismiss }: CompletionCelebrationProps) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(true)

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, 8000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Confetti */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={i * 0.05}
                color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
              />
            ))}
          </div>

          {/* Card */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '40px 36px',
              maxWidth: 420,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <PartyPopper size={48} style={{ color: '#F59E0B', marginBottom: 16 }} />
            </motion.div>

            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              color: '#111827',
              margin: '0 0 8px',
            }}>
              Resume Complete!
            </h2>

            <p style={{
              fontSize: 14,
              color: '#6B7280',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}>
              You've completed all the steps in your guided resume journey.
              Your professional story is ready to shine.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => { handleDismiss(); navigate('/dashboard/resume/final-preview') }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#1F5BAA',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FileCheck size={16} />
                View Your Resume
              </button>

              <button
                onClick={handleDismiss}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Keep Exploring
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
