import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../LanguageSelector'
import { LogoAscendia } from '../common/LogoAscendia'

const NAV_ITEMS = [
  { labelKey: 'nav.menu.howItWorks', href: '#how-it-works' },
  { labelKey: 'nav.menu.memberships', href: '#memberships' },
  { labelKey: 'nav.menu.theMethod', href: '#methodology' },
  { labelKey: 'nav.menu.stories', href: '#stories' },
  { labelKey: 'nav.menu.faq', href: '#faq' },
]

export default function LandingNavbar() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    const isLandingPage = window.location.pathname === '/' || window.location.pathname === '/novaworkglobal'

    if (isLandingPage && href.startsWith('#')) {
      const elementId = href.substring(1)
      const element = document.getElementById(elementId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(`/${href}`)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <LogoAscendia
              className="h-9 w-auto cursor-pointer text-[#91c171]"
              onClick={() => {
                const isLandingPage = window.location.pathname === '/' || window.location.pathname === '/novaworkglobal'
                if (isLandingPage) {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  navigate('/')
                }
              }}
            />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.labelKey}
                href={item.href}
                className="text-sm text-gray-600 hover:text-[var(--ascendia-primary)] transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(item.href)
                }}
              >
                {t(item.labelKey)}
              </a>
            ))}
          </div>

          {/* Desktop: Language Selector & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <button
              onClick={() => navigate('/signin')}
              className="text-sm text-gray-600 hover:text-[var(--ascendia-primary)] font-medium transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              {t('nav.signIn')}
            </button>
            <button
              onClick={() => document.getElementById('memberships')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[var(--ascendia-primary)] text-[var(--ascendia-primary-foreground)] px-5 py-2 rounded-full text-sm font-semibold hover:bg-[var(--ascendia-primary-hover)] transition-colors shadow-sm"
            >
              {t('nav.getStarted')}
            </button>
          </div>

          {/* Mobile: Hamburger */}
          <button
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-[var(--ascendia-primary)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 pb-4 pt-2">
            <div className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.labelKey}
                  href={item.href}
                  className="block px-3 py-2.5 text-sm text-gray-700 hover:text-[var(--ascendia-primary)] hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick(item.href)
                  }}
                >
                  {t(item.labelKey)}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-3 px-3">
              <LanguageSelector />
              <button
                onClick={() => { setMobileOpen(false); navigate('/signin') }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => { setMobileOpen(false); document.getElementById('memberships')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="w-full py-2.5 text-sm font-semibold bg-[var(--ascendia-primary)] text-[var(--ascendia-primary-foreground)] rounded-lg hover:bg-[var(--ascendia-primary-hover)] transition-colors"
              >
                {t('nav.getStarted')}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}