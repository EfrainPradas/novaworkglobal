import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import LanguageSelector from '../../components/LanguageSelector'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError(t('auth.forgotPassword.errors.emailRequired'))
      return
    }

    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        console.error('Reset password error:', resetError)
        setError(resetError.message)
      } else {
        setSent(true)
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
              {t('auth.forgotPassword.backToSignIn')}
            </button>
            <LanguageSelector />
          </div>

          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="NovaWork Global" className="h-24 w-auto block dark:hidden" />
            <img src="/logo-white.png" alt="NovaWork Global" className="h-24 w-auto hidden dark:block" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-2">
            {t('auth.forgotPassword.title')}
          </h1>
          <p className="text-gray-600">
            {t('auth.forgotPassword.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('auth.forgotPassword.sentTitle')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('auth.forgotPassword.sentMessage', { email })}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {t('auth.forgotPassword.sentHint')}
              </p>
              <button
                onClick={() => navigate('/signin')}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {t('auth.forgotPassword.backToSignIn')}
              </button>
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
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('auth.forgotPassword.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-gray-900 placeholder-gray-400"
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.submitButton')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {t('auth.forgotPassword.rememberPassword')}{' '}
                  <button
                    onClick={() => navigate('/signin')}
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    {t('common.signIn')}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
