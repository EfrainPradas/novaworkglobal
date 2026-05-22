import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Linkedin, Instagram, Youtube, Mail } from 'lucide-react'

const SOCIAL_LINKS = {
    linkedin: 'https://www.linkedin.com/company/novaworkglobal',
    instagram: 'https://www.instagram.com/novaworkglobal',
    youtube: 'https://www.youtube.com/@novaworkglobal',
}

export default function LandingFooter() {
    const { t } = useTranslation()

    const contactEmail = t('footer.email', 'hello@ascendia.app')

    return (
        <footer className="bg-[var(--ascendia-text)] text-white/70 py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand + Social */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="text-white text-xl font-bold mb-3">{t('footer.brandName', 'Ascendia')}</h3>
                        <p className="text-sm leading-relaxed mb-5 max-w-xs">
                            {t('footer.tagline')}
                        </p>
                        <div className="flex items-center gap-2">
                            <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-[var(--ascendia-primary)] hover:text-white transition-colors">
                                <Linkedin className="w-3.5 h-3.5" />
                            </a>
                            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-[var(--ascendia-primary)] hover:text-white transition-colors">
                                <Instagram className="w-3.5 h-3.5" />
                            </a>
                            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-[var(--ascendia-primary)] hover:text-white transition-colors">
                                <Youtube className="w-3.5 h-3.5" />
                            </a>
                            <a href={`mailto:${contactEmail}`} aria-label="Email" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-[var(--ascendia-primary)] hover:text-white transition-colors">
                                <Mail className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4">{t('footer.product')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#how-it-works" className="hover:text-white transition-colors">{t('footer.links.howItWorks')}</a></li>
                            <li><a href="#memberships" className="hover:text-white transition-colors">{t('footer.links.memberships')}</a></li>
                            <li><a href="#methodology" className="hover:text-white transition-colors">{t('footer.links.theMethod')}</a></li>
                            <li><a href="#stories" className="hover:text-white transition-colors">{t('footer.links.stories')}</a></li>
                            <li><a href="#faq" className="hover:text-white transition-colors">{t('footer.links.faq')}</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4">{t('footer.company')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/about" className="hover:text-white transition-colors">{t('footer.links.about')}</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.careers')}</a></li>
                            <li><a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors break-all">{t('footer.links.contact')}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.blog')}</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold text-sm mb-4">{t('footer.legal')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/privacy" className="hover:text-white transition-colors">{t('footer.links.privacy')}</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">{t('footer.links.terms')}</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">{t('footer.links.security')}</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 text-center">
                    <p className="text-xs text-white/40">
                        {t('footer.copyright', { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>
        </footer>
    )
}