import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Testimonial {
    name: string
    role: string
    quote: string
    stars: number
}

export default function TestimonialsSection() {
    const { t } = useTranslation()
    const testimonials = t('testimonials.items', { returnObjects: true }) as Testimonial[]

    return (
        <section id="stories" className="py-20 px-4 bg-[var(--ascendia-bg)]">
            <div className="max-w-7xl mx-auto">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-4"
                >
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-xs font-semibold tracking-wider uppercase">
                        {t('testimonials.badge')}
                    </span>
                </motion.div>

                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-[var(--ascendia-text)] mb-6"
                    >
                        <span className="font-serif">{t('testimonials.title')}</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-[var(--ascendia-text-muted)] max-w-2xl mx-auto"
                    >
                        {t('testimonials.subtitle')}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-[var(--ascendia-surface)] rounded-[var(--ascendia-radius-lg)] border border-[var(--ascendia-border-soft)] p-6 md:p-8 flex flex-col transition-all duration-300 hover:shadow-[var(--ascendia-shadow-sm)] hover:-translate-y-1"
                        >
                            {/* Stars */}
                            <div className="flex items-center gap-0.5 mb-4">
                                {Array.from({ length: testimonial.stars }).map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                ))}
                            </div>

                            <Quote className="w-6 h-6 text-[var(--ascendia-accent-hover)] mb-3" />

                            <p className="text-base md:text-lg text-[var(--ascendia-text)] font-medium leading-snug mb-6 flex-grow">
                                "{testimonial.quote}"
                            </p>

                            <div className="border-t border-[var(--ascendia-border-soft)] pt-4">
                                <p className="font-semibold text-[var(--ascendia-text)] text-sm">{testimonial.name}</p>
                                <p className="text-xs text-[var(--ascendia-text-muted)] mt-0.5">{testimonial.role}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}