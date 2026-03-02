import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../LanguageSelector'
import { headerNav } from '../../config/landingContent'

export default function LandingNavbar() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-32">
                    {/* Logo */}
                    <div className="flex items-center">
                        <img
                            src={`${import.meta.env.BASE_URL}logo.png`}
                            alt={headerNav.logo}
                            className="h-28 w-auto cursor-pointer"
                            onClick={() => navigate('/')}
                        />
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {headerNav.menuItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="text-gray-600 hover:text-primary-600 transition-colors"
                                onClick={(e) => {
                                    e.preventDefault()
                                    const isLandingPage = window.location.pathname === '/' || window.location.pathname === '/' || window.location.pathname === '/novaworkglobal';

                                    if (isLandingPage && item.href.startsWith('#')) {
                                        const elementId = item.href.substring(1);
                                        const element = document.getElementById(elementId);
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    } else {
                                        navigate(`/${item.href}`);
                                    }
                                }}
                            >
                                {t(`nav.menu.${item.label.toLowerCase().replace(/\s/g, '')}`)}
                            </a>
                        ))}
                    </div>

                    {/* Language Selector & Auth Buttons */}
                    <div className="flex items-center space-x-4">
                        <LanguageSelector />
                        <button
                            onClick={() => navigate('/signin')}
                            className="text-gray-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-2"
                        >
                            <User className="w-5 h-5" />
                            {t('nav.signIn')}
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                        >
                            {t('nav.getStarted')}
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    )
}
