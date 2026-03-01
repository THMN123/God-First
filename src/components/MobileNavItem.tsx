import React from "react";
import { motion } from "motion/react";
import { cn } from "../utils";

interface MobileNavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export default function MobileNavItem({ active, onClick, icon, label, badge }: MobileNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 py-3 px-4 min-w-[3rem] min-h-[3rem] relative transition-all duration-300 rounded-2xl",
        active ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <div className="relative z-10 transition-transform duration-300 group-active:scale-90">
        {icon}
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[9px] font-black uppercase tracking-[0.15em] relative z-10 transition-colors duration-300",
        active ? "text-emerald-700" : "text-gray-400"
      )}>
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="activeTabMobile"
          className="absolute inset-0 bg-emerald-50/80 rounded-2xl -z-0"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
    </button>
  );
}
