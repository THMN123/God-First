import React from "react";
import { motion } from "motion/react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  subtitle?: string;
  progress?: number; // 0-100
  progressColor?: string;
}

export default function StatCard({ title, value, icon, trend, subtitle, progress, progressColor = "bg-emerald-500" }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
            {trend}
          </span>
        )}
      </div>
      <h4 className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">{title}</h4>
      <p className="text-4xl font-black text-gray-900 tracking-tight">{value}</p>

      {progress !== undefined && !isNaN(progress) && isFinite(progress) && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span>Progress</span>
            <span>{Math.min(100, Math.max(0, Math.round(progress)))}%</span>
          </div>
          <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              className={`h-full ${progressColor}`}
            />
          </div>
        </div>
      )}

      {subtitle && <p className="text-sm text-gray-400 mt-2 font-semibold tracking-tight">{subtitle}</p>}
    </motion.div>
  );
}
