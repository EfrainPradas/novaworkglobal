import { useTranslation } from 'react-i18next'
import Navbar from '../components/layout/LandingNavbar'
import Footer from '../components/layout/LandingFooter'

interface FounderBio {
    id: 'andreina' | 'isabel' | 'efrain'
    photo: string | null
    initials: string
}

const founders: FounderBio[] = [
    { id: 'andreina', photo: '/images/andreina.jpg', initials: 'AV' },
    { id: 'isabel', photo: '/images/isabel.jpg', initials: 'IP' },
    { id: 'efrain', photo: '/images/efrain.jpg', initials: 'EP' },
]

export default function AboutUs() {
    const { t } = useTranslation()

    const scrollTo = (id: string) => {
        const element = document.getElementById(id)
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const menu = [
        { id: 'story', label: t('about.menu.story') },
        { id: 'founders', label: t('about.menu.founders') },
        { id: 'beliefs', label: t('about.menu.beliefs') },
        { id: 'whoWeServe', label: t('about.menu.whoWeServe') },
    ]

    const beliefs = t('about.beliefs.items', { returnObjects: true }) as string[]

    return (
        <div className="min-h-screen font-sans bg-white selection:bg-primary-100 selection:text-primary-900">
            <Navbar />

            <main className="pt-32">
                {/* Hero */}
                <section className="bg-gradient-to-b from-gray-50 to-white py-20">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h1 className="text-sm font-bold tracking-[0.2em] text-primary-600 uppercase mb-6">
                            {t('about.hero.badge')}
                        </h1>
                        <h2 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 leading-tight mb-6">
                            {t('about.hero.title')}
                        </h2>
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                            {t('about.hero.subtitle')}
                        </p>
                    </div>
                </section>

                {/* Section nav */}
                <nav className="sticky top-32 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <ul className="flex flex-wrap justify-center gap-4 md:gap-8 py-4">
                            {menu.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollTo(item.id)}
                                        className="text-sm md:text-base text-gray-600 hover:text-primary-600 font-medium transition-colors"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                {/* Story */}
                <section id="story" className="py-20 md:py-28">
                    <div className="max-w-3xl mx-auto px-6">
                        <h3 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-10">
                            {t('about.story.title')}
                        </h3>
                        <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                            <p>{t('about.story.p1')}</p>
                            <p>{t('about.story.p2')}</p>
                            <p>{t('about.story.p3')}</p>
                            <p className="text-2xl font-serif italic text-primary-700">
                                {t('about.story.p4')}
                            </p>
                            <p>{t('about.story.p5')}</p>
                            <p>{t('about.story.p6')}</p>
                        </div>
                    </div>
                </section>

                {/* Founders intro */}
                <section id="founders" className="py-20 md:py-28 bg-gray-50">
                    <div className="max-w-3xl mx-auto px-6 mb-16">
                        <h3 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-10">
                            {t('about.founders.title')}
                        </h3>
                        <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                            <p className="text-2xl font-serif italic text-gray-900">
                                {t('about.founders.intro')}
                            </p>
                            <p>{t('about.founders.p1')}</p>
                            <p>{t('about.founders.p2')}</p>
                            <p>{t('about.founders.p3')}</p>
                        </div>
                    </div>

                    {/* Bio cards */}
                    <div className="max-w-6xl mx-auto px-6 space-y-16">
                        {founders.map((f) => (
                            <article
                                key={f.id}
                                className="grid md:grid-cols-3 gap-8 md:gap-12 items-start bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100"
                            >
                                <div className="md:col-span-1">
                                    {f.photo ? (
                                        <img
                                            src={f.photo}
                                            alt={t(`about.bios.${f.id}.name`)}
                                            className="w-full aspect-[3/4] object-cover rounded-xl shadow-md"
                                        />
                                    ) : (
                                        <div className="w-full aspect-[3/4] rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                                            <span className="text-6xl font-serif font-medium text-primary-600">
                                                {f.initials}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <h4 className="text-2xl md:text-3xl font-serif font-medium text-gray-900">
                                            {t(`about.bios.${f.id}.name`)}
                                        </h4>
                                        <p className="text-primary-600 font-semibold mt-1">
                                            {t(`about.bios.${f.id}.role`)}
                                        </p>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">
                                        {t(`about.bios.${f.id}.bio`)}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Beliefs */}
                <section id="beliefs" className="py-20 md:py-28">
                    <div className="max-w-4xl mx-auto px-6">
                        <h3 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-4 text-center">
                            {t('about.beliefs.title')}
                        </h3>
                        <p className="text-center text-gray-600 mb-12 text-lg">
                            {t('about.beliefs.subtitle')}
                        </p>
                        <ul className="space-y-4">
                            {Array.isArray(beliefs) &&
                                beliefs.map((belief, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-4 bg-gray-50 rounded-xl p-6 border-l-4 border-primary-500"
                                    >
                                        <span className="text-primary-600 font-bold text-lg shrink-0">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <p className="text-gray-800 text-lg leading-relaxed">
                                            {belief}
                                        </p>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </section>

                {/* Who We Serve */}
                <section id="whoWeServe" className="py-20 md:py-28 bg-gray-50">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h3 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-8">
                            {t('about.whoWeServe.title')}
                        </h3>
                        <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-serif italic">
                            {t('about.whoWeServe.body')}
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
