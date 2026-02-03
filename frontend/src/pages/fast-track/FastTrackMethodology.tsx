
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, FileText, Users, Network } from 'lucide-react'
import { BackButton } from '../../components/common/BackButton'

export default function FastTrackMethodology() {
    const navigate = useNavigate()

    const steps = [
        {
            id: 1,
            title: 'Plan Your Search',
            icon: Compass,
            color: 'blue',
            description: 'Define your target market and strategy.',
            details: [
                { title: 'Define Your Target Market', text: 'Treat your job search like a marketing campaign by defining your ideal roles and companies.' },
                { title: 'Research Industry Trends', text: 'Investigate in-demand skills, salary ranges, and company news to focus your energy effectively.' },
                { title: 'Create a Personal Marketing Plan', text: 'Build a clear plan with goals and timelines to eliminate guesswork and guide your actions.' }
            ]
        },
        {
            id: 2,
            title: 'Apply Smart Online',
            icon: FileText,
            color: 'teal',
            description: 'Tailor resumes to beat the system.',
            details: [
                { title: 'Tailor Resumes to Beat the System', text: 'Customize each resume with specific keywords to pass automated filters (ATS) and catch attention.' },
                { title: 'Boost Callback Rates from 2% to 80%', text: 'After applying, secure an internal referral to dramatically increase your chances of being noticed.' }
            ]
        },
        {
            id: 3,
            title: 'Leverage Recruiters',
            icon: Users,
            color: 'orange',
            description: 'Understand their role: The Company is the Client.',
            details: [
                { title: 'Understand Their Role', text: 'Work with recruiters as business partners, not as personal job finders.' },
                { title: 'Maximize Your Visibility', text: 'Connect with many relevant recruiters in your industry to ensure your profile appears for the right roles.' }
            ]
        },
        {
            id: 4,
            title: 'Network with Impact',
            icon: Network,
            color: 'yellow',
            description: 'Access the Hidden Job Market.',
            details: [
                { title: 'Access the Hidden Job Market', text: 'Up to 80% of jobs are filled through referrals and recommendations, not online postings.' },
                { title: 'Master Your 90-Second Story', text: "Don't just list titles; tell a memorable story about your career path, choices, and impact." },
                { title: 'Never Ask for a Job Directly', text: 'Instead, ask for insights and contacts to expand your network and uncover opportunities.' }
            ]
        }
    ]

    const getColorClasses = (color: string) => {
        const classes = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100' },
            teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: 'bg-teal-100' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'bg-orange-100' },
            yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'bg-yellow-100' }
        }
        return classes[color as keyof typeof classes]
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

                {/* Header */}
                <div>
                    <BackButton to="/job-search-hub" label="Back to Job Search Hub" className="mb-6 pl-0" />
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-teal-400 to-orange-400"></div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            The Fast-Track Job Search
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                            A strategic, 4-step system turning the job search into a <span className="text-indigo-600 font-bold">targeted personal marketing campaign</span>.
                        </p>
                        <div className="flex justify-center flex-wrap gap-4">
                            <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm font-semibold">1. Plan</div>
                            <div className="px-4 py-2 bg-teal-50 text-teal-800 rounded-full text-sm font-semibold">2. Apply</div>
                            <div className="px-4 py-2 bg-orange-50 text-orange-800 rounded-full text-sm font-semibold">3. Recruiters</div>
                            <div className="px-4 py-2 bg-yellow-50 text-yellow-800 rounded-full text-sm font-semibold">4. Network</div>
                        </div>
                    </div>
                </div>

                {/* Explainer Video */}
                <div className="aspect-video w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-xl mb-12 border border-gray-100 bg-black">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/nGT0IWNOj4M"
                        title="Job Search Methodology"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {steps.map((step) => {
                        const colors = getColorClasses(step.color)
                        const Icon = step.icon
                        return (
                            <div key={step.id} className={`bg-white rounded-2xl p-8 border ${colors.border} shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}>
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                    <Icon className="w-32 h-32" />
                                </div>

                                <div className="relative z-10">
                                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${colors.bg} ${colors.text} mb-6`}>
                                        <span className="font-bold">STEP {step.id}</span>
                                        <span className="w-1 h-4 bg-current opacity-30 rounded-full"></span>
                                        <span className="font-bold uppercase tracking-wide">{step.title}</span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.description}</h3>

                                    <div className="space-y-6">
                                        {step.details.map((detail, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center font-bold text-sm mt-1`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 mb-1">{detail.title}</h4>
                                                    <p className="text-gray-600 leading-relaxed text-sm">{detail.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Call to Action */}
                <div className="bg-indigo-900 rounded-2xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')] opacity-10 bg-cover bg-center"></div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6">Ready to Start Step 1?</h2>
                        <p className="text-indigo-100 text-lg mb-8">
                            Begin by defining your target market, industries, and creating your personal marketing plan.
                        </p>
                        <button
                            onClick={() => navigate('/job-search/plan-your-search')}
                            className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all flex items-center gap-3 mx-auto shadow-lg"
                        >
                            Start Your Search Plan <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
