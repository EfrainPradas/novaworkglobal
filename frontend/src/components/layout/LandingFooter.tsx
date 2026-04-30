import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Linkedin, Instagram, Youtube, Mail } from 'lucide-react'

const CONTACT_EMAIL = 'hello@novaworkglobal.com'
const SOCIAL_LINKS = {
    linkedin: 'https://www.linkedin.com/company/novaworkglobal',
    instagram: 'https://www.instagram.com/novaworkglobal',
    youtube: 'https://www.youtube.com/@novaworkglobal',
}

export default function LandingFooter() {
    const { t } = useTranslation()

    return (
        <footer className="bg-gray-900 text-gray-300 py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
                    {/* Brand + Social */}
                    <div className="col-span-2 md:col-span-2">
                        <h3 className="text-white text-xl font-bold mb-3">NovaWork Global</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-sm">
                            {t('footer.tagline')}
                        </p>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                {t('footer.followUs', 'Follow us')}
                            </p>
                            <div className="flex items-center gap-3">
                                <a
                                    href={SOCIAL_LINKS.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white transition-colors"
                                >
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <a
                                    href={SOCIAL_LINKS.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white transition-colors"
                                >
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a
                                    href={SOCIAL_LINKS.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="YouTube"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white transition-colors"
                                >
                                    <Youtube className="w-4 h-4" />
                                </a>
                                <a
                                    href={`mailto:${CONTACT_EMAIL}`}
                                    aria-label="Email"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Programs */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.programs')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/programs/novanext" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.novanext')}</Link></li>
                            <li><Link to="/programs/novarearchitect" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.novarearchitect')}</Link></li>
                            <li><Link to="/programs/novaalign" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.novalign')}</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.company')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/methodology" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.methodology')}</Link></li>
                            <li><Link to="/insights" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.insights')}</Link></li>
                        </ul>
                    </div>

                    {/* Contact + Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.contact', 'Contact')}</h4>
                        <ul className="space-y-2 text-sm mb-6">
                            <li>
                                <a
                                    href={`mailto:${CONTACT_EMAIL}`}
                                    className="text-gray-400 hover:text-white transition-colors break-all"
                                >
                                    {CONTACT_EMAIL}
                                </a>
                            </li>
                        </ul>
                        <h4 className="text-white font-semibold mb-4">{t('footer.legal')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.privacy')}</Link></li>
                            <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">{t('footer.links.terms')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        {t('footer.copyright', { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>
        </footer>
    )
}
