import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import LanguageSelector from '../../components/LanguageSelector'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)

  // Supabase detects the recovery token from the URL hash automatically and
  // emits a PASSWORD_RECOVERY auth event. Wait for it before enabling the form.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      } else if (event === 'SIGNED_IN' && session) {
        setValidSession(true)
      }
    })

    // Fallback: check if a session exists already (link just clicked)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true)
      else {
        // Give onAuthStateChange a moment to fire
        setTimeout(() => {
          setValidSession(prev => prev === null ? false : prev)
        }, 1500)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!password || !confirmPassword) {
      setError(t('auth.resetPassword.errors.fillAllFields'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.resetPassword.errors.passwordLength'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.resetPassword.errors.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        console.error('Update password error:', updateError)
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/signin')}
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('common.backToHome')}
            </button>
            <LanguageSelector />
          </div>

          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="NovaWork Global" className="h-24 w-auto block dark:hidden" />
            <img src="/logo-white.png" alt="NovaWork Global" className="h-24 w-auto hidden dark:block" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
            {t('auth.resetPassword.title')}
          </h1>
          <p className="text-gray-600">
            {t('auth.resetPassword.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('auth.resetPassword.successTitle')}
              </h2>
              <p className="text-gray-600">
                {t('auth.resetPassword.successMessage')}
              </p>
            </div>
          ) : validSession === false ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('auth.resetPassword.invalidTitle')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('auth.resetPassword.invalidMessage')}
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {t('auth.resetPassword.requestNew')}
              </button>
            </div>
          ) : validSession === null ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 mt-4">{t('auth.resetPassword.verifying')}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.resetPassword.newPassword')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.resetPassword.confirmPassword')}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth.resetPassword.updating') : t('auth.resetPassword.submitButton')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
