import { Quote, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Testimonial {
    role: string;
    country: string;
    quote: string;
}

export default function TestimonialsSection() {
    const { t } = useTranslation();
    const testimonials = t('testimonials.items', { returnObjects: true }) as Testimonial[];

    return (
        <section className="py-24 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-semibold text-blue-600 tracking-wide uppercase">{t('testimonials.badge')}</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        {t('testimonials.title')}
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                        {t('testimonials.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {testimonials.map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 relative flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                        >
                            <Quote className="absolute top-8 right-8 w-10 h-10 text-blue-100 transform rotate-180" />

                            <div className="flex-1 mb-6">
                                <p className="text-gray-700 text-lg leading-relaxed relative z-10 italic">
                                    "{testimonial.quote}"
                                </p>
                            </div>

                            <div className="mt-auto border-t border-gray-100 pt-6">
                                <p className="font-semibold text-gray-900 text-base">
                                    {testimonial.role}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{testimonial.country}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
