import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MapPin, Phone, Send, ArrowLeft, CheckCircle } from 'lucide-react'
import { LogoAscendia } from '@/components/common/LogoAscendia'

export default function ContactPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const mailtoLink = `mailto:hello@ascendia.app?subject=${encodeURIComponent(form.subject || 'Contact from website')}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`
      window.open(mailtoLink, '_blank')
      setSubmitted(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{t('contact.back', 'Back to Home')}</span>
              </button>
            </div>
            <div className="flex items-center">
              <LogoAscendia className="h-8 w-auto text-[#91c171]" />
            </div>
            <div className="w-24" />
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('contact.title', 'Get in Touch')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('contact.subtitle', 'Have a question, feedback, or need help? We\'d love to hear from you. Our team typically responds within 24 hours.')}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 md:gap-12">
          {/* Contact Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('contact.infoTitle', 'Contact Information')}
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--ascendia-primary)]/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[var(--ascendia-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t('contact.emailLabel', 'Email')}</p>
                    <a href="mailto:hello@ascendia.app" className="text-sm text-[var(--ascendia-primary)] hover:underline">hello@ascendia.app</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--ascendia-primary)]/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[var(--ascendia-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t('contact.locationLabel', 'Location')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('contact.locationValue', 'Salt Lake City, Utah, USA')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--ascendia-primary)]/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[var(--ascendia-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t('contact.hoursLabel', 'Response Time')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('contact.hoursValue', 'Within 24 hours')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[var(--ascendia-primary)] to-[var(--ascendia-primary-dark,#5a9a3a)] rounded-2xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">{t('contact.quickTitle', 'Need Quick Help?')}</h3>
              <p className="text-white/90 text-sm mb-4">{t('contact.quickDesc', 'Check our FAQ section for instant answers to common questions.')}</p>
              <button
                onClick={() => navigate('/#faq')}
                className="px-4 py-2 bg-white text-[var(--ascendia-primary)] rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                {t('contact.viewFaq', 'View FAQ')}
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('contact.successTitle', 'Message Ready!')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('contact.successMessage', 'Your email client should have opened with the message pre-filled. If it didn\'t, you can email us directly at hello@ascendia.app')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2.5 bg-[var(--ascendia-primary)] text-white rounded-lg font-semibold hover:bg-[var(--ascendia-primary-dark,#5a9a3a)] transition-colors"
                  >
                    {t('contact.backHome', 'Back to Home')}
                  </button>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('contact.sendAnother', 'Send Another')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contact.nameLabel', 'Full Name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--ascendia-primary)] focus:border-[var(--ascendia-primary)] outline-none transition-all"
                      placeholder={t('contact.namePlaceholder', 'Your name')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contact.emailLabel2', 'Email Address')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--ascendia-primary)] focus:border-[var(--ascendia-primary)] outline-none transition-all"
                      placeholder={t('contact.emailPlaceholder', 'you@example.com')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('contact.subjectLabel', 'Subject')}
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--ascendia-primary)] focus:border-[var(--ascendia-primary)] outline-none transition-all"
                  >
                    <option value="">{t('contact.subjectDefault', 'Select a topic')}</option>
                    <option value="General Inquiry">{t('contact.subjectGeneral', 'General Inquiry')}</option>
                    <option value="Technical Support">{t('contact.subjectSupport', 'Technical Support')}</option>
                    <option value="Billing">{t('contact.subjectBilling', 'Billing')}</option>
                    <option value="Partnership">{t('contact.subjectPartnership', 'Partnership')}</option>
                    <option value="Feedback">{t('contact.subjectFeedback', 'Feedback')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('contact.messageLabel', 'Message')} *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[var(--ascendia-primary)] focus:border-[var(--ascendia-primary)] outline-none transition-all resize-y"
                    placeholder={t('contact.messagePlaceholder', 'How can we help you?')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending || !form.name.trim() || !form.email.trim() || !form.message.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--ascendia-primary)] text-white rounded-lg font-semibold hover:bg-[var(--ascendia-primary-dark,#5a9a3a)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('contact.sending', 'Sending...')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t('contact.sendButton', 'Send Message')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--ascendia-text)] text-white/70 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-white/40">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  )
}