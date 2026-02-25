import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LandingFooter() {
    const { t } = useTranslation()
    const renderLink = (link: { label: string; href: string }) => {
        if (link.href.startsWith('http') || link.href.startsWith('mailto')) {
            return (
                <a href={link.href} className="text-gray-400 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                    {link.label}
                </a>
            )
        }
        return (
            <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                {link.label}
            </Link>
        )
    }

    return (
        <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <h3 className="text-white text-xl font-bold mb-4">NovaWork Global</h3>
                        <p className="text-gray-400">
                            {t('footer.tagline')}
                        </p>
                    </div>

                    {/* Programs */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.programs')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="/programs/novanext" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.novanext')}</Link></li>
                            <li><Link to="/programs/novarearchitect" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.novarearchitect')}</Link></li>
                            <li><Link to="/programs/novaalign" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.novalign')}</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.company')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.about')}</Link></li>
                            <li><Link to="/methodology" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.methodology')}</Link></li>
                            <li><Link to="/insights" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.insights')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.legal')}</h4>
                        <ul className="space-y-2">
                            <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.privacy')}</Link></li>
                            <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.terms')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center">
                    <p className="text-gray-400">
                        {t('footer.copyright', { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>
        </footer>
    )
}
