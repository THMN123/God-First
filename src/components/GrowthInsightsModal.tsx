import React, { useState, useEffect, useCallback } from "react";
import { X, Calendar, TrendingUp, Users, ArrowUpRight, ArrowDownLeft, Award, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
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
        d.setMonth(d.getMonth() - 5); // Last 6 months
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Timezone-safe boundaries: full day coverage
            const params = new URLSearchParams({
                startDate: `${startDate}T00:00:00.000Z`,
                endDate: `${endDate}T23:59:59.999Z`,
            });
            const res = await fetch(`/api/analytics?${params.toString()}`, { credentials: 'include' });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                setError(errData?.error || `Server error (${res.status}). Please try again.`);
                return;
            }
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError("Network error. Check your connection and try again.");
            console.error("Failed to fetch analytics:", err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (isOpen) {
            fetchAnalytics();
        }
    }, [isOpen, fetchAnalytics]);

    if (!isOpen) return null;

    const hasData = data && (data.totalSavings > 0 || data.totalLoans > 0 || data.activeMembersCount > 0);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-[#F5F5F0] w-full max-w-4xl rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-10 shadow-2xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden border border-white/20"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
                    <div>
                        <h3 className="text-xl md:text-3xl font-black tracking-tight text-gray-900">Advanced Insights</h3>
                        <p className="text-xs md:text-sm text-gray-500 font-bold mt-0.5">Group performance analytics</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchAnalytics}
                            disabled={loading}
                            title="Refresh data"
                            className="p-2 md:p-3 bg-white hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl md:rounded-2xl transition-all shadow-sm disabled:opacity-40"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button onClick={onClose} className="p-2 md:p-3 bg-white hover:bg-gray-100 rounded-xl md:rounded-2xl transition-all shadow-sm">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Period Start</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                            <input
                                type="date"
                                className="w-full pl-9 pr-3 py-3 rounded-xl bg-white border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-bold shadow-sm text-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Period End</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                            <input
                                type="date"
                                className="w-full pl-9 pr-3 py-3 rounded-xl bg-white border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-bold shadow-sm text-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl mb-6 shrink-0">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-black text-sm">Failed to load data</p>
                            <p className="text-xs mt-0.5 opacity-80">{error}</p>
                        </div>
                        <button onClick={fetchAnalytics} className="ml-auto text-xs font-black underline whitespace-nowrap">Retry</button>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-6">

                    {/* Loading Skeleton */}
                    {loading && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-5 rounded-2xl animate-pulse">
                                        <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                                        <div className="h-8 bg-gray-100 rounded w-2/3 mb-2" />
                                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white p-5 rounded-[1.5rem] animate-pulse space-y-4">
                                <div className="h-4 bg-gray-100 rounded w-1/4" />
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-50 rounded-2xl" />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Stats & Leaderboard */}
                    {!loading && data && (
                        <>
                            {/* Stat Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0 }}
                                    className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm relative overflow-hidden group"
                                >
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ArrowDownLeft size={90} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Total Savings</p>
                                    <p className={cn("text-2xl md:text-3xl font-black", data.totalSavings > 0 ? "text-emerald-700" : "text-gray-300")}>
                                        M{(data.totalSavings || 0).toLocaleString()}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                                        <TrendingUp size={11} />
                                        <span>Verified contributions</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.07 }}
                                    className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm relative overflow-hidden group"
                                >
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ArrowUpRight size={90} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Loans Granted</p>
                                    <p className={cn("text-2xl md:text-3xl font-black", data.totalLoans > 0 ? "text-amber-700" : "text-gray-300")}>
                                        M{(data.totalLoans || 0).toLocaleString()}
                                    </p>
                                    <div className="mt-2 text-amber-600 font-bold text-[10px] uppercase tracking-wider">
                                        Capital circulation
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.14 }}
                                    className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm relative overflow-hidden group"
                                >
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Users size={90} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Active Members</p>
                                    <p className={cn("text-2xl md:text-3xl font-black", data.activeMembersCount > 0 ? "text-blue-700" : "text-gray-300")}>
                                        {data.activeMembersCount || 0}
                                    </p>
                                    <div className="mt-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                                        Contributing this period
                                    </div>
                                </motion.div>
                            </div>

                            {/* Leaderboard */}
                            <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Award className="text-amber-500 w-5 h-5" />
                                    <h4 className="text-lg font-black tracking-tight">Top Savers</h4>
                                    <span className="text-[10px] font-black text-gray-400 ml-auto">
                                        {startDate} → {endDate}
                                    </span>
                                </div>

                                {data.leaderboard.length === 0 ? (
                                    <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                        <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
                                        <p className="font-black text-gray-400">No verified savings in this period.</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Try widening the date range, or check that transactions have been approved.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.leaderboard.map((member, idx) => (
                                            <motion.div
                                                key={member.phone}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.06 }}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-emerald-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-lg",
                                                        idx === 0 ? "bg-amber-100" :
                                                        idx === 1 ? "bg-gray-200" :
                                                        idx === 2 ? "bg-orange-100" : "bg-white border border-gray-100"
                                                    )}>
                                                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : <span className="text-sm text-gray-400">{idx + 1}</span>}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-sm md:text-base leading-tight">{member.name || "Unknown"}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold">{member.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg md:text-2xl font-black text-emerald-600 leading-none">M{member.total.toLocaleString()}</p>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Saved</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Empty initial state */}
                    {!loading && !error && !data && (
                        <div className="py-20 text-center text-gray-400">
                            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold">Select a date range to load insights.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && hasData && (
                    <div className="mt-6 pt-4 border-t border-gray-100 text-center shrink-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                            "Commitment is the cornerstone of shared wealth."
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
