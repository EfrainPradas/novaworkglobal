
import { Linkedin, ExternalLink, Filter, Users, Building2, Search } from 'lucide-react'
import { BackButton } from '../../components/common/BackButton'

export default function HeadhunterSearch() {

    const linkedInSearchUrl = "https://www.linkedin.com/search/results/people/?keywords=recruiter&origin=SWITCH_SEARCH_VERTICAL&sid=Q1j"

    const openLinkedInSearch = () => {
        window.open(linkedInSearchUrl, '_blank')
    }

    const externalLists = [
        { name: "Forbes: America's Best Recruiting Firms", url: "https://www.forbes.com/lists/best-executive-recruiting-firms/", desc: "Top executive search firms ranking." },
        { name: "Hunt Scanlon Top 50", url: "https://huntscanlon.com/top-50/", desc: "Leading recruiters ranking." },
        { name: "ClearlyRated's Best of Staffing", url: "https://www.clearlyrated.com/staffing", desc: "Client-rated staffing agencies." }
    ]

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

                {/* Header */}
                <div>
                    <BackButton to="/job-search-hub" label="Back to Job Search" className="mb-6 pl-0" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg">
                            <Users className="w-8 h-8" />
                        </span>
                        Leverage Recruiters
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-lg">
                        Don't wait to be found. Proactively connect with the gatekeepers of your industry.
                    </p>
                </div>

                {/* Strategy Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-200">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Strategy: The Company is the Client</h2>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-4">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Recruiters work for companies, not candidates. To get on their radar, you need to show them you solve their client's problem.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 min-w-5 min-h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">✓</div>
                                    <span className="text-gray-700 dark:text-gray-300">Target recruiters specializing in your industry/niche.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 min-w-5 min-h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">✓</div>
                                    <span className="text-gray-700 dark:text-gray-300">Connect BEFORE you need a job (build the relationship).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 min-w-5 min-h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">✓</div>
                                    <span className="text-gray-700 dark:text-gray-300">Make your LinkedIn headline searchable (Keywords matter).</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-xl max-w-md w-full">
                            <h4 className="font-bold text-orange-900 dark:text-orange-200 mb-2 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Pro Tip: Filtering
                            </h4>
                            <p className="text-sm text-orange-800 dark:text-orange-300 mb-4">
                                Use LinkedIn's "All Filters" and set Industry to <strong>"Staffing and Recruiting"</strong> to find external headhunters, or look for "Talent Acquisition" for internal HR.
                            </p>
                            <button
                                onClick={openLinkedInSearch}
                                className="w-full py-2 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 font-semibold rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center gap-2"
                            >
                                <Linkedin className="w-4 h-4" /> Try LinkedIn Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Direct Search Generator */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col transition-colors duration-200">
                        <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
                            <Search className="w-6 h-6" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Find Recruiters Now</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                            Generate a targeted LinkedIn search for recruiters in your industry.
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Your Industry / Role</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. Software Sales, Marketing..."
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium">
                                    Search
                                </button>
                            </div>
                            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">Opens LinkedIn in new tab</p>
                        </div>
                    </div>

                    {/* External Lists */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col transition-colors duration-200">
                        <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
                            <Building2 className="w-6 h-6" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Firm Rankings</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Browse reputable lists of search firms to identify targets.
                        </p>
                        <div className="space-y-3 flex-grow">
                            {externalLists.map((list, idx) => (
                                <a
                                    key={idx}
                                    href={list.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{list.name}</span>
                                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{list.desc}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
