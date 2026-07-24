import React from 'react';
import { ShieldCheck, Wifi, WifiOff, RefreshCw, Cross } from 'lucide-react';
import { WhatsAppStatus } from '../types';

interface HeaderProps {
  whatsappStatus: WhatsAppStatus;
  onRefreshStatus: () => void;
  onOpenWhatsAppCard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  whatsappStatus,
  onRefreshStatus,
  onOpenWhatsAppCard,
}) => {
  const isConnected = whatsappStatus.status === 'CONNECTED';
  const isPairing = whatsappStatus.status === 'PAIRING';

  return (
    <header className="sticky top-0 z-40 bg-[#F2F2F7]/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Group Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
            <Cross className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none font-sans">
                God-First
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-100 text-amber-800 rounded-md border border-amber-200/50">
                Savings & Loans
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase bg-slate-900 text-white rounded-md shadow-xs">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Community Wealth & Stewardship
            </p>
          </div>
        </div>

        {/* WhatsApp Status Indicator Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWhatsAppCard}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80'
                : isPairing
                ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/80'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected
                    ? 'bg-emerald-500'
                    : isPairing
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              ></span>
            </span>

            <span className="hidden xs:inline">
              {isConnected
                ? 'WhatsApp Active'
                : isPairing
                ? 'Scan QR Code'
                : 'WhatsApp Off'}
            </span>
            <span className="xs:hidden">
              {isConnected ? 'WhatsApp' : 'Offline'}
            </span>
          </button>

          <button
            onClick={onRefreshStatus}
            title="Refresh WhatsApp Status"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
