import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import LanguageSelector from '../../components/LanguageSelector'

export default function SignUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Get trial info from URL
  const isTrial = searchParams.get('trial') === 'true'
  const trialTier = searchParams.get('tier')

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    // Validation
    if (!email || !password || !confirmPassword) {
      setError(t('auth.signUp.errors.fillAllFields'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.signUp.errors.passwordMismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('auth.signUp.errors.passwordLength'))
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            is_trial: isTrial,
            trial_tier: trialTier
          }
        },
      })

      if (signUpError) {
        console.error('Sign up error:', signUpError)
        setError(signUpError.message)
      } else {
        console.log('Sign up successful:', data)
        setMessage(t('auth.signUp.success'))
        // Clear form
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    try {
      console.log('Initiating Google OAuth...')
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google OAuth error:', error)
        setError(`Google sign up failed: ${error.message}`)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred with Google sign up.')
    }
  }

  async function handleLinkedInSignUp() {
    try {
      console.log('Initiating LinkedIn OAuth...')
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('LinkedIn OAuth error:', error)
        setError(`LinkedIn sign up failed: ${error.message}`)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred with LinkedIn sign up.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t('common.backToHome')}
            </button>
            <LanguageSelector />
          </div>

          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="NovaWork Global" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
            {isTrial ? `Start Your ${trialTier === 'executive' ? 'Executive' : 'Pro'} Trial` : t('auth.signUp.title')}
          </h1>
          <p className="text-gray-600">
            {isTrial ? 'Create your account to activate your 7-day free trial' : t('auth.signUp.subtitle')}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignUp}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('common.continueWith', { provider: 'Google' })}
            </button>

            <button
              onClick={handleLinkedInSignUp}
              className="w-full bg-[#0077B5] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#006399] transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              {t('common.continueWith', { provider: 'LinkedIn' })}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                {t('common.orContinueWith')}
              </span>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.signUp.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder={t('auth.signUp.emailPlaceholder')}
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.signUp.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder={t('auth.signUp.passwordPlaceholder')}
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.signUp.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder={t('auth.signUp.confirmPasswordPlaceholder')}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.signUp.creatingAccount') : t('auth.signUp.createAccount')}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            {t('auth.signUp.terms')}{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">
              {t('auth.signUp.termsLink')}
            </a>{' '}
            {t('auth.signUp.and')}{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">
              {t('auth.signUp.privacyLink')}
            </a>
          </p>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.signUp.alreadyHaveAccount')}{' '}
              <button
                onClick={() => navigate('/signin')}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                {t('common.signIn')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
