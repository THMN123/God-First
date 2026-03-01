import React from "react";
import { cn } from "../utils";

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export default function NavItem({ active, onClick, icon, label, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
        active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("transition-transform group-hover:scale-110", active ? "text-white" : "text-gray-400 group-hover:text-emerald-600")}>
          {icon}
        </span>
        <span className="font-bold text-sm tracking-wide">{label}</span>
      </div>
      {badge && (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
          active ? "bg-white text-emerald-600" : "bg-red-500 text-white"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}
