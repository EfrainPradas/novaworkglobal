
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Activity, BrainCircuit, Briefcase } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export const AnalyticsDashboardPreview = () => {
    const [stats, setStats] = useState({ users: 0, resumes: 0, hired: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Use relative path to leverage Vite proxy
                const response = await fetch(`${API_BASE_URL}/api/analytics/stats`);
                const data = await response.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Failed to load analytics stats:', error);
                // No fallback to fake data - show real 0s if failed
                setStats({ users: 0, resumes: 0, hired: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
    };

    return (
        <div className="relative w-full max-w-lg mx-auto">
            {/* Glassmorphic Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-600" />
                            Live Career Insights
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Powered by dbt™ & Supabase
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                        BETA
                    </span>
                </div>

                {/* Content */}
                <div>
                    {/* Social Proof Stats */}
                    <div className="grid grid-cols-3 gap-2 p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                                {loading ? '...' : formatNumber(stats.users)}{!loading && '+'}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Users</div>
                        </div>
                        <div className="text-center border-l border-r border-gray-200">
                            <div className="text-lg font-bold text-primary-600">
                                {loading ? '...' : formatNumber(stats.resumes)}{!loading && '+'}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Resumes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-teal-600">
                                {loading ? '...' : formatNumber(stats.hired)}{!loading && '+'}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hired</div>
                        </div>
                    </div>

                    {/* Smart Action Plan */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Fast-Track Roadmap</h4>
                                <p className="text-xs text-gray-500">Achieve weeks of work in minutes</p>
                            </div>
                            <div className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Live
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Action 1 */}
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-colors group cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-sm font-bold text-gray-900">Tailor resume to JD</h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Keyword Optimization</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs font-bold text-gray-900">10 min</span>
                                    <span className="text-[10px] text-gray-400">avg. time</span>
                                </div>
                            </div>

                            {/* Action 2 */}
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors group cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-sm font-bold text-gray-900">Update Headline</h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Brand Positioning</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs font-bold text-gray-900">6 min</span>
                                    <span className="text-[10px] text-gray-400">avg. time</span>
                                </div>
                            </div>

                            {/* Action 3 */}
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50/30 transition-colors group cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-sm font-bold text-gray-900">Interview Prep</h5>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">AI Simulation</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs font-bold text-gray-900">15 min</span>
                                    <span className="text-[10px] text-gray-400">avg. time</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 text-center">
                            <p className="text-xs text-gray-400">
                                ⚡️ Typical candidates take <span className="text-gray-600 font-medium">10+ hours</span> to do this manually.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
