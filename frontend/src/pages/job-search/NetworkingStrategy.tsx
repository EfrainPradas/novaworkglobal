import { useState } from 'react'
import { Network, Mic, Calendar, ChevronRight, MessageSquare } from 'lucide-react'
import { BackButton } from '../../components/common/BackButton'

export default function NetworkingStrategy() {
    const [story, setStory] = useState({
        who: '',
        wins: '',
        goal: ''
    })

    const [activeWeek, setActiveWeek] = useState(1)

    const weeks = [
        { id: 1, title: 'Week 1-2', focus: 'Identification', goal: 'List 50 Contacts', checked: false },
        { id: 2, title: 'Week 3-4', focus: 'Outreach', goal: 'Sent 20 Messages', checked: false },
        { id: 3, title: 'Week 5-6', focus: 'Meetings', goal: 'Completed 10 Coffee Chats', checked: false },
        { id: 4, title: 'Week 7-8', focus: 'Follow-up', goal: 'Secured 3 Referrals', checked: false },
    ]

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

                {/* Header */}
                <div>
                    <BackButton to="/job-search-hub" label="Back to Job Search" className="mb-6 pl-0" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <span className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">
                            <Network className="w-8 h-8" />
                        </span>
                        Networking Strategy
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-lg">
                        Access the 80% of jobs that are never posted. Master your story and follow the 60-day plan.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* The 90-Second Story Builder */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-200">
                        <div className="flex items-center gap-3 mb-6 text-indigo-600 dark:text-indigo-400">
                            <Mic className="w-6 h-6" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Career Clarity Snapshot™</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                            When someone asks "Tell me about yourself", don't recite your resume. Use your Clarity Snapshot.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">1. Who You Are (Current Role/Passion)</label>
                                <textarea
                                    value={story.who}
                                    onChange={(e) => setStory({ ...story, who: e.target.value })}
                                    placeholder="I am a [Role] with a passion for [Area]..."
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none h-20 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                />
                            </div>
                        </div>
                        <div className="space-y-6 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">2. Your Wins (The "Why You")</label>
                                <textarea
                                    value={story.wins}
                                    onChange={(e) => setStory({ ...story, wins: e.target.value })}
                                    placeholder="Recently, I [Achievement] which resulted in [Outcome]..."
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none h-20 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                />
                            </div>
                        </div>
                        <div className="space-y-6 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">3. Your Goal (The Ask)</label>
                                <textarea
                                    value={story.goal}
                                    onChange={(e) => setStory({ ...story, goal: e.target.value })}
                                    placeholder="I'm looking to pivot into [Industry] where I can leverage my skills in..."
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none h-20 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex gap-3">
                            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Practice Tip</h4>
                                <p className="text-xs text-indigo-800 dark:text-indigo-300">Record yourself reading this aloud. If it takes longer than 90 seconds, cut the details. Focus on impact.</p>
                            </div>
                        </div>
                    </div>

                    {/* 60-Day Networking Plan */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-200">
                        <div className="flex items-center gap-3 mb-6 text-green-600 dark:text-green-400">
                            <Calendar className="w-6 h-6" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">60-Day Plan</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                            Success comes from consistency. Follow this bi-weekly sprint schedule.
                        </p>

                        <div className="space-y-4">
                            {weeks.map((week) => (
                                <div
                                    key={week.id}
                                    onClick={() => setActiveWeek(week.id)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${activeWeek === week.id
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500 shadow-sm'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeWeek === week.id ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {week.id}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${activeWeek === week.id ? 'text-green-900 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>{week.title}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{week.focus}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Goal</p>
                                                <p className={`text-sm font-medium ${activeWeek === week.id ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {week.goal}
                                                </p>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 ${activeWeek === week.id ? 'text-green-500 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                "Your network is your net worth." — Porter Gale
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
