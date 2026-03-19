import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { TourConfig, TourState } from '../types/tour'
import { supabase } from '../../lib/supabase'

interface TourContextValue {
  activeTour: TourConfig | null
  tourState: TourState | null
  currentStep: number
  isTourOpen: boolean
  startTour: (config: TourConfig) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  endTour: (completed?: boolean) => void
  closeTour: () => void
}

const TourContext = createContext<TourContextValue | undefined>(undefined)

interface TourProviderProps {
  children: ReactNode
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [tourState, setTourState] = useState<TourState | null>(null)
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const loadTourState = useCallback(async (tourId: string) => {
    if (!userId) return null
    
    const { data } = await supabase
      .from('user_tour_state')
      .select('*')
      .eq('user_id', userId)
      .eq('tour_id', tourId)
      .single()

    if (data) {
      return {
        completed: data.completed,
        skipped: data.skipped,
        currentStep: data.current_step,
        lastViewedAt: data.last_viewed_at
      }
    }
    return null
  }, [userId])

  const saveTourState = useCallback(async (tourId: string, state: TourState) => {
    if (!userId) return
    
    await supabase
      .from('user_tour_state')
      .upsert({
        user_id: userId,
        tour_id: tourId,
        completed: state.completed,
        skipped: state.skipped,
        current_step: state.currentStep,
        last_viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,tour_id'
      })
  }, [userId])

  const startTour = useCallback(async (config: TourConfig) => {
    const state = await loadTourState(config.id)
    
    if (state && (state.completed || state.skipped)) {
      return
    }

    setActiveTour(config)
    setCurrentStep(0)
    setIsTourOpen(true)
    
    setTourState({
      completed: false,
      skipped: false,
      currentStep: 0
    })
  }, [loadTourState])

  const nextStep = useCallback(() => {
    if (!activeTour) return
    
    if (currentStep >= activeTour.steps.length - 1) {
      endTour(true)
      return
    }
    
    const newStep = currentStep + 1
    setCurrentStep(newStep)
    
    if (tourState && activeTour) {
      const newState = { ...tourState, currentStep: newStep }
      setTourState(newState)
      saveTourState(activeTour.id, newState)
    }
  }, [activeTour, currentStep, tourState, saveTourState])

  const prevStep = useCallback(() => {
    if (currentStep <= 0) return
    const newStep = currentStep - 1
    setCurrentStep(newStep)
    
    if (tourState && activeTour) {
      const newState = { ...tourState, currentStep: newStep }
      setTourState(newState)
      saveTourState(activeTour.id, newState)
    }
  }, [currentStep, tourState, activeTour, saveTourState])

  const goToStep = useCallback((step: number) => {
    if (!activeTour || step < 0 || step >= activeTour.steps.length) return
    setCurrentStep(step)
    
    if (tourState && activeTour) {
      const newState = { ...tourState, currentStep: step }
      setTourState(newState)
      saveTourState(activeTour.id, newState)
    }
  }, [activeTour, tourState, saveTourState])

  const endTour = useCallback(async (completed: boolean = true) => {
    if (!activeTour) return
    
    const finalState: TourState = {
      completed,
      skipped: !completed,
      currentStep: currentStep,
      lastViewedAt: new Date().toISOString()
    }
    
    await saveTourState(activeTour.id, finalState)
    
    setActiveTour(null)
    setTourState(null)
    setCurrentStep(0)
    setIsTourOpen(false)
  }, [activeTour, currentStep, saveTourState])

  const closeTour = useCallback(async () => {
    if (!activeTour) return
    
    if (tourState) {
      await saveTourState(activeTour.id, { ...tourState, skipped: true })
    }
    
    setActiveTour(null)
    setIsTourOpen(false)
  }, [activeTour, tourState, saveTourState])

  return (
    <TourContext.Provider value={{
      activeTour,
      tourState,
      currentStep,
      isTourOpen,
      startTour,
      nextStep,
      prevStep,
      goToStep,
      endTour,
      closeTour
    }}>
      {children}
    </TourContext.Provider>
  )
}

export const useTour = () => {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

export const useTourState = (tourId: string) => {
  const { startTour } = useTour()
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkState = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('user_tour_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('tour_id', tourId)
        .single()

      if (data) {
        setIsCompleted(data.completed)
        setIsSkipped(data.skipped)
      }
      setIsLoading(false)
    }

    checkState()
  }, [tourId])

  const hasSeenTour = isCompleted || isSkipped

  return { isCompleted, isSkipped, isLoading, hasSeenTour }
}