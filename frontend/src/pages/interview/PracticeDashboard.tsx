import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { InterviewPreparation } from '../../types/interview'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function PracticeDashboard() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [interview, setInterview] = useState<InterviewPreparation | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSendingRef = useRef(false)
  const messagesRef = useRef<Message[]>([]) // Backup ref to track messages persistently

  useEffect(() => {
    loadData()
    initializeSpeechRecognition()
    initializeSpeechSynthesis()
  }, [id])

  useEffect(() => {
    // Cleanup speech and timeouts on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadData = async () => {
    try {
      const { data: interviewData, error: interviewError } = await supabase
        .from('interview_preparations')
        .select('*')
        .eq('id', id)
        .single()

      if (interviewError) throw interviewError
      setInterview(interviewData)
    } catch (error) {
      console.error('Error loading interview:', error)
      alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Your browser does not support voice recognition. Please use Chrome or Edge.')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true // Keep listening continuously
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎤 MICROPHONE STARTED')
      console.log('  📝 Current transcript:', transcript.substring(0, 50))
      console.log('  ⚙️ isProcessing:', isProcessing)
      console.log('  🔒 isSendingRef:', isSendingRef.current)
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      console.log('🎙️ Speech recognition result event:', {
        resultIndex: event.resultIndex,
        resultsLength: event.results.length,
        isSending: isSendingRef.current,
        isProcessing: isProcessing,
        currentTranscript: transcript.substring(0, 30) + '...'
      })

      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultText = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += resultText + ' '
          console.log('  ✓ Final result:', resultText)
        } else {
          interimTranscript += resultText
          console.log('  ... Interim result:', resultText)
        }
      }

      if (finalTranscript) {
        const newTranscript = (transcript + ' ' + finalTranscript).trim()
        console.log('🗣️ Final transcript accumulated:', newTranscript)
        setTranscript(newTranscript)

        // Clear any existing timeout to prevent multiple sends
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current)
          console.log('⏱️ Cleared previous auto-send timeout')
        }

        // Set new timeout for auto-send after 2 seconds of silence
        autoSendTimeoutRef.current = setTimeout(() => {
          console.log('⏰ Auto-send timeout fired!')
          console.log('  📝 Transcript to send:', newTranscript)
          console.log('  🔒 isSendingRef:', isSendingRef.current)
          console.log('  ⚙️ isProcessing:', isProcessing)

          // Only send if not already sending and has content
          if (newTranscript.trim() && !isSendingRef.current && !isProcessing) {
            console.log('✅ AUTO-SENDING response')
            // DON'T set isSendingRef here - let sendResponse do it
            sendResponse(newTranscript)
          } else {
            console.log('❌ SKIPPED auto-send - already sending or processing')
          }
        }, 2000) // Increased to 2 seconds
        console.log('⏱️ Set auto-send timeout for 2 seconds')
      } else if (interimTranscript) {
        // Show interim results in real-time but don't replace accumulated text
        const displayTranscript = (transcript + ' ' + interimTranscript).trim()
        console.log('  💬 Interim display:', displayTranscript.substring(0, 30) + '...')
        setTranscript(displayTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Recognition error: ${event.error}`)
      }
      // Keep listening even after errors
      if (interviewStarted && !isProcessing) {
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start()
            } catch (e) {
              console.log('Recognition already started')
            }
          }
        }, 1000)
      }
    }

    recognition.onend = () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🛑 MICROPHONE ENDED')
      console.log('  📝 Final transcript:', transcript.substring(0, 50))
      console.log('  ⚙️ isProcessing:', isProcessing)
      console.log('  🔒 isSendingRef:', isSendingRef.current)
      console.log('  🔊 isSpeaking:', isSpeaking)
      setIsListening(false)
      // DO NOT auto-restart here - we'll restart manually when ready
      // This prevents the mic from restarting while AI is speaking
    }

    recognitionRef.current = recognition
  }

  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis

      // Load voices immediately
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || []
        console.log('🔊 Voices loaded:', voices.length, voices.map(v => v.name))
      }

      // Try to load voices
      loadVoices()

      // Some browsers load voices asynchronously
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices
      }
    } else {
      console.warn('Speech Synthesis not supported in this browser')
    }
  }

  const speakText = async (text: string): Promise<void> => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🗣️ AI WILL SPEAK (OpenAI TTS)')
    console.log('  📝 Text:', text.substring(0, 80) + '...')
    console.log('  🎤 isListening:', isListening)
    console.log('  ⚙️ isProcessing:', isProcessing)

    // CRITICAL: Stop any existing audio FIRST to prevent overlapping voices
    if (audioRef.current) {
      console.log('🛑 STOPPING PREVIOUS AUDIO to prevent overlap')
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      } catch (e) {
        console.log('⚠️ Could not stop previous audio:', e)
      }
    }

    // FORCEFULLY STOP MICROPHONE before AI speaks to prevent feedback
    if (recognitionRef.current) {
      try {
        // Use abort() instead of stop() to immediately terminate
        recognitionRef.current.abort()
        console.log('🔇 FORCEFULLY ABORTED MICROPHONE to prevent AI feedback')
      } catch (e) {
        console.log('⚠️ Recognition abort failed:', e)
      }
    } else {
      console.log('ℹ️ Microphone not initialized')
    }

    return new Promise(async (resolve, reject) => {
      try {
        console.log('🌐 Requesting audio from OpenAI TTS...')

        // Get auth token
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('No authentication token')
        }

        // Call backend to get TTS audio
        const response = await fetch(`/api/interviews/${id}/text-to-speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: text,
            voice: 'nova' // Options: alloy, echo, fable, onyx, nova, shimmer
          })
        })

        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`)
        }

        console.log('✅ Audio received, creating audio element...')

        // Get audio blob
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // Create and play audio
        const audio = new Audio(audioUrl)
        audioRef.current = audio // Store reference for stopping

        audio.onloadedmetadata = () => {
          console.log(`🎵 Audio loaded, duration: ${audio.duration.toFixed(2)}s`)
        }

        audio.onplay = () => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('🔊 AI SPEECH STARTED (OpenAI TTS)')
          setIsSpeaking(true)
        }

        audio.onended = () => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('✅ AI SPEECH ENDED - ready for user input')
          console.log('  🎤 isListening:', isListening)
          console.log('  ⚙️ isProcessing:', isProcessing)
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl) // Clean up
          audioRef.current = null
          resolve()
        }

        audio.onerror = (error) => {
          console.error('❌ Audio playback error:', error)
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
          audioRef.current = null
          resolve() // Resolve anyway to continue flow
        }

        console.log('▶️ Playing OpenAI TTS audio...')
        await audio.play()

      } catch (error) {
        console.error('❌ Error in speakText (OpenAI TTS):', error)
        setIsSpeaking(false)
        reject(error)
      }
    })
  }

  const stopSpeaking = () => {
    // Stop OpenAI TTS audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setIsSpeaking(false)
      console.log('🛑 Stopped OpenAI TTS audio')
    }
    // Fallback: stop browser speech synthesis if still in use
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startInterview = async () => {
    setInterviewStarted(true)
    setIsProcessing(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/interviews/${id}/ai-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          messages: []
        })
      })

      if (!response.ok) throw new Error('Failed to start interview')

      const data = await response.json()

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      // Update both state and ref
      messagesRef.current = [aiMessage]
      setMessages([aiMessage])

      // Make AI speak the response (waits until speech finishes)
      await speakText(data.response)

      // Speech has finished - now start listening
      console.log('🔄 AI intro finished, starting microphone')
      isSendingRef.current = false
      setIsProcessing(false)

      // Small delay then start listening
      setTimeout(() => {
        if (recognitionRef.current && !isListening) {
          console.log('🎤 Starting microphone for first user input')
          startListening()
        }
      }, 500)
    } catch (error) {
      console.error('Error starting interview:', error)
      setError('Error starting the interview')
      isSendingRef.current = false
      setIsProcessing(false)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      console.log('▶️ START LISTENING - clearing transcript, starting recognition')
      console.log('  📝 Previous transcript:', transcript.substring(0, 50))
      setTranscript('')
      try {
        recognitionRef.current.start()
        console.log('  ✅ Recognition started successfully')
      } catch (e) {
        console.error('  ❌ Failed to start recognition:', e)
      }
    } else {
      console.log('⚠️ Cannot start listening - recognitionRef:', !!recognitionRef.current, 'isListening:', isListening)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const sendResponse = async (textToSend?: string) => {
    const messageText = textToSend || transcript

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📤 SEND RESPONSE CALLED')
    console.log('  📝 Message text:', messageText)
    console.log('  🔒 isSendingRef:', isSendingRef.current)
    console.log('  ⚙️ isProcessing:', isProcessing)
    console.log('  🎤 isListening:', isListening)

    // Prevent multiple simultaneous sends
    if (!messageText.trim() || isProcessing || isSendingRef.current) {
      console.log('❌ CANNOT SEND - conditions not met')
      return
    }

    // Set sending flag
    isSendingRef.current = true
    console.log('✅ Setting isSendingRef = true')

    // Clear any pending auto-send timeout
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current)
      autoSendTimeoutRef.current = null
      console.log('🧹 Cleared pending timeout')
    }

    // Stop listening while processing
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
        console.log('🛑 Stopped microphone for API call')
      } catch (e) {
        console.log('⚠️ Recognition already stopped:', e)
      }
    } else {
      console.log('ℹ️ Microphone already stopped or not initialized')
    }

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    console.log('💾 Adding user message to chat')
    const currentTranscript = messageText

    // Build messages array using REF (persistent) instead of state
    const updatedMessages = [...messagesRef.current, userMessage]
    console.log(`📊 messagesRef count: ${messagesRef.current.length}, messages state count: ${messages.length}, Updated count: ${updatedMessages.length}`)

    // Update both ref and state
    messagesRef.current = updatedMessages
    setMessages(updatedMessages)  // Update state to show in UI

    setTranscript('')
    setIsProcessing(true)
    console.log('⚙️ Set isProcessing = true')

    try {
      // Build messages array for API with the updated messages
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      console.log(`📨 Sending ${apiMessages.length} messages to AI`)
      console.log(`📋 Message history:`, apiMessages.map((m, i) => `${i + 1}. ${m.role}: ${m.content.substring(0, 50)}...`))

      const response = await fetch(`${API_BASE_URL}/api/interviews/${id}/ai-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          messages: apiMessages,
          userResponse: currentTranscript
        })
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      console.log('💾 AI message added to chat')

      // Update both ref and state with AI response
      messagesRef.current = [...messagesRef.current, aiMessage]
      setMessages(messagesRef.current)

      // Make AI speak the response (waits until speech finishes)
      console.log('🎵 Calling speakText (will wait for completion)...')
      await speakText(data.response)
      console.log('🎵 speakText completed!')

      // Speech has finished - now we can restart the microphone
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔄 AI FINISHED SPEAKING - RESTARTING MICROPHONE')
      console.log('  🎤 isListening:', isListening)
      console.log('  ⚙️ isProcessing:', isProcessing)
      console.log('  🔒 isSendingRef:', isSendingRef.current)

      isSendingRef.current = false // Reset flag - ready for new input
      setIsProcessing(false)
      console.log('  ✅ Reset isSendingRef and isProcessing')

      // Small delay then restart listening
      setTimeout(() => {
        console.log('⏰ Timeout fired - checking if should restart microphone')
        console.log('  🎤 recognitionRef:', !!recognitionRef.current, 'isListening:', isListening)
        if (recognitionRef.current && !isListening) {
          console.log('✅ RESTARTING MICROPHONE FOR USER INPUT')
          startListening()
        } else {
          console.log('⚠️ NOT restarting - conditions not met')
        }
      }, 500)
    } catch (error) {
      console.error('❌ ERROR in sendResponse:', error)
      setError('Error sending response')
      isSendingRef.current = false
      setIsProcessing(false)
    }
  }

  const endInterview = async () => {
    if (!interviewStarted) return

    console.log('🏁 END INTERVIEW BUTTON CLICKED')
    setIsProcessing(true)

    try {
      // Stop any current audio first
      if (audioRef.current) {
        console.log('🛑 Stopping current audio before ending interview')
        audioRef.current.pause()
        audioRef.current = null
        setIsSpeaking(false)
      }

      // Stop microphone
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
          console.log('🔇 Stopped microphone')
        } catch (e) {
          console.log('⚠️ Recognition abort failed:', e)
        }
      }

      // Use messagesRef for the most up-to-date messages
      const apiMessages = messagesRef.current.map(m => ({
        role: m.role,
        content: m.content
      }))

      console.log('📤 Sending end interview request with', apiMessages.length, 'messages')

      const response = await fetch(`${API_BASE_URL}/api/interviews/${id}/ai-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          messages: apiMessages,
          userResponse: 'finaliza'
        })
      })

      if (!response.ok) throw new Error('Failed to end interview')

      const data = await response.json()

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      // Update both ref and state
      messagesRef.current = [...messagesRef.current, aiMessage]
      setMessages(messagesRef.current)

      console.log('🎵 Playing final goodbye message...')
      // IMPORTANT: Wait for AI to finish speaking before re-enabling button
      await speakText(data.response)
      console.log('✅ Final message completed')

    } catch (error) {
      console.error('❌ Error ending interview:', error)
      setError('Error ending the interview')
    } finally {
      console.log('🔓 Re-enabling button (isProcessing = false)')
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!interview) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/interview/${id}`)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 flex items-center gap-2"
          >
            ← Back to Interview
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 AI Mock Interview Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice with a conversational AI interviewer - Not saved, just for practice!
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
          {!interviewStarted ? (
            /* Start Screen */
            <div className="p-12 text-center">
              <div className="text-6xl mb-6">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready for your mock interview?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                InterviewPro will ask you realistic questions based on your position ({interview.position_title || 'Not specified'})
                and give you immediate feedback. Use the microphone to respond naturally.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">💡 How it works:</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li>• 🗣️ The AI interviewer will SPEAK to you using natural voice</li>
                  <li>• 🎤 Talk back naturally - the mic will listen and transcribe your responses</li>
                  <li>• 💬 Have a real conversation about your CAR stories and experiences</li>
                  <li>• 🎯 Practice for 6-8 exchanges to get comfortable</li>
                  <li>• ⚡ <strong>This is practice only - nothing is saved</strong></li>
                  <li>• 🔊 <strong>Make sure your volume is ON!</strong></li>
                </ul>
              </div>

              <button
                onClick={startInterview}
                disabled={isProcessing}
                className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Starting...' : 'Start Voice Interview 🎤'}
              </button>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Status Indicator - Visual feedback */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
                <div className="flex items-center justify-center gap-3">
                  {isSpeaking && (
                    <>
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center animate-pulse">
                          <span className="text-2xl">🗣️</span>
                        </div>
                        <div className="absolute inset-0 w-12 h-12 rounded-full bg-purple-400 animate-ping opacity-75"></div>
                      </div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="inline-block animate-pulse">AI Interviewer is speaking...</span>
                      </div>
                    </>
                  )}
                  {isListening && !isSpeaking && (
                    <>
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse">
                          <span className="text-2xl">🎤</span>
                        </div>
                        <div className="absolute inset-0 w-12 h-12 rounded-full bg-green-400 animate-ping opacity-75"></div>
                      </div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="inline-block animate-pulse">Listening to you...</span>
                      </div>
                    </>
                  )}
                  {!isSpeaking && !isListening && interviewStarted && (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-2xl">⏸️</span>
                      </div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Paused
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Voice-Only Interview Area */}
              <div className="h-[500px] flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-200">
                <div className="text-center max-w-2xl">
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                    🎙️ This is a voice-only practice session
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Listen to the interviewer and respond naturally. Your conversation is not displayed to avoid distractions.
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
                <div className="flex justify-center items-center">
                  <button
                    onClick={endInterview}
                    disabled={isProcessing || messages.filter(m => m.role === 'user').length < 2}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    title={messages.filter(m => m.role === 'user').length < 2 ? 'Answer at least 2 questions to end' : 'End the interview'}
                  >
                    End Interview 🏁
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tips */}
        {!interviewStarted && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">📝 Tips for a great interview:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <div className="font-semibold text-primary-600 dark:text-primary-400 mb-2">🎯 Structure your answers:</div>
                <ul className="space-y-1">
                  <li>• Use the PAR format (Problem-Action-Result)</li>
                  <li>• Be specific with metrics and numbers</li>
                  <li>• Tell real stories, not theory</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-primary-600 dark:text-primary-400 mb-2">🗣️ Effective communication:</div>
                <ul className="space-y-1">
                  <li>• Speak clearly and don't rush</li>
                  <li>• Keep responses between 2-3 minutes</li>
                  <li>• Show enthusiasm and confidence</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
