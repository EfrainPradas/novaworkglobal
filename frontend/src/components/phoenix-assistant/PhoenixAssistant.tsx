import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhoenixMood = 'idle' | 'talking' | 'celebrating' | 'thinking' | 'waving'

export interface PhoenixTip {
  id: string
  message: string
  mood?: PhoenixMood
  duration?: number // ms, 0 = manual dismiss, default 6000
}

interface PhoenixAssistantProps {
  tips?: PhoenixTip[]
  currentTipId?: string | null
  onTipDismiss?: (tipId: string) => void
  onTipComplete?: (tipId: string) => void
  onOpen?: () => void
  mood?: PhoenixMood
  className?: string
}

// ─── Phoenix SVG ──────────────────────────────────────────────────────────────

function PhoenixCharacter({ mood, size = 80 }: { mood: PhoenixMood; size?: number }) {
  const wingControls = useAnimationControls()
  const bodyControls = useAnimationControls()
  const eyeControls = useAnimationControls()
  const tailControls = useAnimationControls()
  const crownControls = useAnimationControls()

  useEffect(() => {
    switch (mood) {
      case 'celebrating':
        wingControls.start({
          rotate: [0, -25, 15, -25, 15, 0],
          transition: { duration: 1.2, repeat: 2, ease: 'easeInOut' },
        })
        bodyControls.start({
          y: [0, -6, 0, -6, 0],
          transition: { duration: 0.6, repeat: 3, ease: 'easeInOut' },
        })
        crownControls.start({
          scale: [1, 1.3, 1, 1.3, 1],
          transition: { duration: 0.5, repeat: 3 },
        })
        break
      case 'talking':
        wingControls.start({
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        })
        bodyControls.start({
          y: [0, -2, 0],
          transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        })
        break
      case 'thinking':
        bodyControls.start({
          rotate: [0, 3, -3, 0],
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        })
        eyeControls.start({
          y: [0, -1, 0, -1, 0],
          transition: { duration: 1.5, repeat: Infinity },
        })
        break
      case 'waving':
        wingControls.start({
          rotate: [0, -30, 10, -30, 10, 0],
          transition: { duration: 1, repeat: 1, ease: 'easeInOut' },
        })
        bodyControls.start({
          y: [0, -4, 0],
          transition: { duration: 0.5, repeat: 2, ease: 'easeInOut' },
        })
        break
      default: // idle
        wingControls.start({
          rotate: [0, -3, 3, 0],
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        })
        bodyControls.start({
          y: [0, -3, 0],
          transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        })
        tailControls.start({
          rotate: [0, 5, -5, 0],
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        })
        break
    }
  }, [mood, wingControls, bodyControls, eyeControls, tailControls, crownControls])

  return (
    <motion.svg
      viewBox="0 0 120 130"
      width={size}
      height={size}
      animate={bodyControls}
      style={{ originX: '50%', originY: '60%' }}
    >
      <defs>
        {/* Logo-matching blue gradients */}
        <radialGradient id="phoenixGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="wingGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="wingGradDark" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="tailGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <linearGradient id="crownGrad" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="chestGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
      </defs>

      {/* Ambient glow */}
      <circle cx="60" cy="58" r="50" fill="url(#phoenixGlow)" />

      {/* Tail feathers — flowing downward like logo */}
      <motion.g animate={tailControls} style={{ originX: '60px', originY: '90px' }}>
        <path d="M50 88 Q38 100 28 118 Q35 108 42 98 Q46 92 50 88 Z" fill="url(#tailGrad)" opacity="0.7" />
        <path d="M55 90 Q48 108 42 125 Q50 112 55 100 Z" fill="url(#tailGrad)" opacity="0.6" />
        <path d="M60 88 Q60 110 56 128 Q60 115 62 100 Z" fill="url(#tailGrad)" opacity="0.5" />
        <path d="M65 90 Q72 108 78 125 Q70 112 65 100 Z" fill="url(#tailGrad)" opacity="0.6" />
        <path d="M70 88 Q82 100 92 118 Q85 108 78 98 Q74 92 70 88 Z" fill="url(#tailGrad)" opacity="0.7" />
      </motion.g>

      {/* Body — sleek elongated shape */}
      <path d="M48 50 Q45 60 46 75 Q48 88 60 92 Q72 88 74 75 Q75 60 72 50 Q68 42 60 40 Q52 42 48 50 Z"
        fill="url(#bodyGrad)" />

      {/* Chest highlight — lighter blue area */}
      <path d="M52 55 Q50 65 52 78 Q55 86 60 88 Q65 86 68 78 Q70 65 68 55 Q65 48 60 46 Q55 48 52 55 Z"
        fill="url(#chestGrad)" opacity="0.35" />

      {/* Left wing — sweeping upward like logo */}
      <motion.g animate={wingControls} style={{ originX: '48px', originY: '58px' }}>
        {/* Back feather layer (darker) */}
        <path d="M48 58 Q30 40 15 18 Q20 30 28 42 Q35 50 48 56 Z"
          fill="url(#wingGradDark)" opacity="0.9" />
        {/* Mid feather layer */}
        <path d="M48 62 Q28 48 10 30 Q18 42 30 52 Q38 58 48 60 Z"
          fill="url(#wingGradLight)" opacity="0.85" />
        {/* Front feather layer (lightest) */}
        <path d="M48 66 Q32 56 18 42 Q25 52 35 60 Q42 64 48 65 Z"
          fill="#7dd3fc" opacity="0.7" />
      </motion.g>

      {/* Right wing — sweeping upward */}
      <motion.g animate={wingControls} style={{ originX: '72px', originY: '58px' }}>
        <path d="M72 58 Q90 40 105 18 Q100 30 92 42 Q85 50 72 56 Z"
          fill="url(#wingGradDark)" opacity="0.9" />
        <path d="M72 62 Q92 48 110 30 Q102 42 90 52 Q82 58 72 60 Z"
          fill="url(#wingGradLight)" opacity="0.85" />
        <path d="M72 66 Q88 56 102 42 Q95 52 85 60 Q78 64 72 65 Z"
          fill="#7dd3fc" opacity="0.7" />
      </motion.g>

      {/* Neck */}
      <path d="M55 45 Q58 38 60 35 Q62 38 65 45 Q63 40 60 38 Q57 40 55 45 Z"
        fill="url(#bodyGrad)" />

      {/* Head — elegant rounded */}
      <ellipse cx="60" cy="32" rx="11" ry="10" fill="url(#bodyGrad)" />

      {/* Head highlight */}
      <ellipse cx="58" cy="30" rx="7" ry="6" fill="#0ea5e9" opacity="0.25" />

      {/* Crown / Crest — pointed upward like logo */}
      <motion.g animate={crownControls} style={{ originX: '60px', originY: '28px' }}>
        <path d="M54 24 Q50 10 48 4 Q54 14 56 22 Z" fill="url(#crownGrad)" />
        <path d="M58 22 Q57 8 58 2 Q60 12 59 20 Z" fill="url(#crownGrad)" />
        <path d="M62 22 Q63 8 62 2 Q60 12 61 20 Z" fill="#7dd3fc" opacity="0.8" />
        <path d="M66 24 Q70 10 72 4 Q66 14 64 22 Z" fill="url(#crownGrad)" />
      </motion.g>

      {/* Eyes — small and expressive */}
      <motion.g animate={eyeControls}>
        <circle cx="55" cy="31" r="2.5" fill="white" />
        <circle cx="55.8" cy="31" r="1.4" fill="#0f172a" />
        <circle cx="56.3" cy="30.3" r="0.5" fill="white" />
        <circle cx="65" cy="31" r="2.5" fill="white" />
        <circle cx="65.8" cy="31" r="1.4" fill="#0f172a" />
        <circle cx="66.3" cy="30.3" r="0.5" fill="white" />
      </motion.g>

      {/* Beak — small, elegant */}
      <path d="M58 36 L60 41 L62 36 Z" fill="#0ea5e9" />
      <path d="M58 36 L60 38 L62 36 Z" fill="#0284c7" />

      {/* Sparkles for celebrating mood — blue themed */}
      {mood === 'celebrating' && (
        <>
          <motion.circle cx="20" cy="20" r="2" fill="#7dd3fc"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} />
          <motion.circle cx="100" cy="25" r="1.5" fill="#38bdf8"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }} />
          <motion.circle cx="25" cy="65" r="1.5" fill="#0ea5e9"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.5 }} />
          <motion.circle cx="95" cy="60" r="2" fill="#0ea5e9"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
          <motion.path d="M15 45 L17 41 L19 45 L15 43 L19 43 Z" fill="#7dd3fc"
            animate={{ opacity: [0, 1, 0], rotate: [0, 180] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
          <motion.path d="M101 48 L103 44 L105 48 L101 46 L105 46 Z" fill="#38bdf8"
            animate={{ opacity: [0, 1, 0], rotate: [0, -180] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
        </>
      )}
    </motion.svg>
  )
}

// ─── Speech Bubble ────────────────────────────────────────────────────────────

function SpeechBubble({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="absolute bottom-full right-0 mb-2 w-64 z-50"
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-sky-200 dark:border-sky-800/40 p-4">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Message */}
        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed pr-4">
          {message}
        </p>

        {/* Tail pointer */}
        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-sky-200 dark:border-sky-800/40 rotate-45" />
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PhoenixAssistant({
  tips = [],
  currentTipId,
  onTipDismiss,
  onTipComplete,
  onOpen,
  mood: externalMood,
  className = '',
}: PhoenixAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTip, setActiveTip] = useState<PhoenixTip | null>(null)
  const [internalMood, setInternalMood] = useState<PhoenixMood>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mood = externalMood ?? internalMood

  // Show tip when currentTipId changes
  useEffect(() => {
    if (currentTipId) {
      const tip = tips.find(t => t.id === currentTipId)
      if (tip) {
        setActiveTip(tip)
        setIsOpen(true)
        setIsMinimized(false)
        setInternalMood(tip.mood ?? 'talking')

        // Auto-dismiss after duration
        if (timerRef.current) clearTimeout(timerRef.current)
        const duration = tip.duration ?? 6000
        if (duration > 0) {
          timerRef.current = setTimeout(() => {
            handleDismissTip(tip.id)
          }, duration)
        }
      }
    }
  }, [currentTipId, tips]) // eslint-disable-line

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const handleDismissTip = useCallback((tipId: string) => {
    setActiveTip(null)
    setInternalMood('idle')
    if (timerRef.current) clearTimeout(timerRef.current)
    onTipDismiss?.(tipId)
    onTipComplete?.(tipId)
  }, [onTipDismiss, onTipComplete])

  const handleToggle = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false)
      setIsOpen(true)
      setInternalMood('waving')
      setTimeout(() => setInternalMood('idle'), 1500)
    } else if (isOpen) {
      setIsMinimized(true)
      setIsOpen(false)
      if (activeTip) {
        handleDismissTip(activeTip.id)
      }
    } else {
      setIsOpen(true)
      setInternalMood('waving')
      setTimeout(() => setInternalMood('idle'), 1500)
      onOpen?.()
    }
  }, [isMinimized, isOpen, activeTip, handleDismissTip, onOpen])

  // Minimized state — just a small button
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className={`fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:shadow-blue-500/50 transition-shadow ${className}`}
      >
        <MessageCircle className="w-5 h-5" />
      </motion.button>
    )
  }

  return (
    <div className={`fixed bottom-24 right-6 z-50 ${className}`}>
      {/* Speech bubble */}
      <AnimatePresence>
        {activeTip && isOpen && (
          <SpeechBubble
            message={activeTip.message}
            onDismiss={() => handleDismissTip(activeTip.id)}
          />
        )}
      </AnimatePresence>

      {/* Phoenix character */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative cursor-pointer"
            onClick={handleToggle}
            title="Click to minimize"
          >
            <PhoenixCharacter mood={mood} size={80} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button when fully closed */}
      {!isOpen && !isMinimized && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:shadow-blue-500/50 transition-shadow"
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  )
}

// ─── Export character for standalone use ───────────────────────────────────────
export { PhoenixCharacter }
