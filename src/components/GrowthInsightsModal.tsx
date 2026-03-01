import React, { useState, useEffect } from "react";
import { X, Calendar, TrendingUp, Users, ArrowUpRight, ArrowDownLeft, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";

interface AnalyticsData {
    totalSavings: number;
    totalLoans: number;
    activeMembersCount: number;
    leaderboard: Array<{ phone: string, name: string, total: number }>;
}

interface GrowthInsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GrowthInsightsModal({ isOpen, onClose }: GrowthInsightsModalProps) {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // Default to start of current month
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAnalytics();
        }
    }, [isOpen, startDate, endDate]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`, { credentials: 'include' });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#F5F5F0] w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-gray-900">Advanced Insights</h3>
                        <p className="text-gray-500 font-bold">In-depth performance analytics for the group</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Period Start</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                            <input
                                type="date"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-bold shadow-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Period End</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                            <input
                                type="date"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-bold shadow-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-3xl border border-white shadow-sm relative overflow-hidden group"
                        >
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <ArrowDownLeft size={100} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Total Savings</p>
                            <p className="text-3xl font-black text-gray-900">M{(data?.totalSavings || 0).toLocaleString()}</p>
                            <div className="mt-2 flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                <TrendingUp size={14} />
                                <span>Verified Contributions</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10, delay: 0.1 }}
                            animate={{ opacity: 1, y: 0, delay: 0.1 }}
                            className="bg-white p-6 rounded-3xl border border-white shadow-sm relative overflow-hidden group"
                        >
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <ArrowUpRight size={100} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Loans Granted</p>
                            <p className="text-3xl font-black text-gray-900">M{(data?.totalLoans || 0).toLocaleString()}</p>
                            <div className="mt-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                                Capital Circulation
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10, delay: 0.2 }}
                            animate={{ opacity: 1, y: 0, delay: 0.2 }}
                            className="bg-white p-6 rounded-3xl border border-white shadow-sm relative overflow-hidden group"
                        >
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Users size={100} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Active Members</p>
                            <p className="text-3xl font-black text-gray-900">{data?.activeMembersCount || 0}</p>
                            <div className="mt-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                                Contributing this period
                            </div>
                        </motion.div>
                    </div>

                    {/* Performance Leaderboard */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <Award className="text-amber-500" size={24} />
                            <h4 className="text-xl font-black tracking-tight">Top Savers Leaderboard</h4>
                        </div>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                                <div className="animate-spin w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full mb-4" />
                                <p className="font-bold">Analyzing group performance...</p>
                            </div>
                        ) : (data?.leaderboard.length || 0) === 0 ? (
                            <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                                <p className="font-bold">No contributions found for this period.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data?.leaderboard.map((member, idx) => (
                                    <motion.div
                                        key={member.phone}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-emerald-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                                                idx === 0 ? "bg-amber-100 text-amber-600" :
                                                    idx === 1 ? "bg-gray-100 text-gray-600" :
                                                        idx === 2 ? "bg-orange-100 text-orange-600" : "bg-white text-gray-400"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 text-lg leading-tight">{member.name}</p>
                                                <p className="text-xs text-gray-400 font-bold">{member.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-emerald-600 leading-none">M{member.total.toLocaleString()}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Total Savings</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                        "Commitment is the cornerstone of shared wealth."
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
