import React from 'react';
import { LayoutDashboard, Users, ArrowLeftRight } from 'lucide-react';

export type TabType = 'dashboard' | 'members' | 'transact';

interface FloatingBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'members' as TabType,
      label: 'Members',
      icon: Users,
    },
    {
      id: 'transact' as TabType,
      label: 'Transact',
      icon: ArrowLeftRight,
    },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-[calc(100%-24px)] max-w-[380px] sm:max-w-md pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="pointer-events-auto rounded-full bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-slate-950/40 p-1.5 flex items-center justify-between gap-1 w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2.5 sm:px-4 rounded-full text-xs font-bold transition-all duration-200 select-none whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="tracking-tight text-[11px] sm:text-xs">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

