import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, ShieldCheck, CheckCircle2, RefreshCw, ArrowRight, Lock, Cross, Sparkles, AlertCircle } from 'lucide-react';
import { WhatsAppStatus } from '../types';

interface WhatsAppGatewayProps {
  whatsappStatus: WhatsAppStatus;
  onConnectWhatsApp: () => void;
  onConfirmPair: (phone?: string) => Promise<void> | void;
  onAuthenticateAndProceed: () => void;
}

const REFRESH_INTERVAL_SECONDS = 25;

export const WhatsAppGateway: React.FC<WhatsAppGatewayProps> = ({
  whatsappStatus,
  onConnectWhatsApp,
  onAuthenticateAndProceed,
}) => {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);

  const isConnected = whatsappStatus.status === 'CONNECTED';

  // 1. Automated QR Code Generation on mount
  useEffect(() => {
    if (!isConnected && !whatsappStatus.qrCodeDataUrl) {
      onConnectWhatsApp();
    }
  }, [isConnected]);

  // 2. Automated QR Code Auto-Refresh Timer
  useEffect(() => {
    if (isConnected) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onConnectWhatsApp();
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected, onConnectWhatsApp]);

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Soft Ambient Background Highlights */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full space-y-6 relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-xs font-bold text-slate-800 mb-1">
            <Cross className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
            <span>God-First Savings & Loans Group</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 font-semibold">Admin Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            WhatsApp Session Integration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-medium leading-relaxed">
            Automated Baileys session pairing for batch financial statement dispatches and Administrator access.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          {/* Admin Rights Notice Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-950 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block text-amber-950">Administrator Controls Active</span>
              <span>
                All ledger management, member edits, and transaction postings are restricted to the group Administrator.
              </span>
            </div>
          </div>

          {/* Connected State */}
          {isConnected ? (
            <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-emerald-950">WhatsApp Connected Successfully!</h3>
                <p className="text-xs text-emerald-700 font-medium">
                  Active session paired with <span className="font-bold">{whatsappStatus.phoneNumber}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onAuthenticateAndProceed}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
              >
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Disconnected State: Left = Instructions & Direct Access, Right = Automated QR Code */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* LEFT SIDE (md:col-span-7): Set of Instructions & Direct Access */}
              <div className="md:col-span-7 space-y-5">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    How to Link WhatsApp Session
                  </h3>

                  <ol className="text-xs text-slate-600 space-y-2.5 font-medium list-none">
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Open <strong className="text-slate-900">WhatsApp</strong> on your mobile phone.</span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Tap <strong className="text-slate-900">Menu</strong> (Android) or <strong className="text-slate-900">Settings</strong> (iOS) &gt; <strong className="text-slate-900">Linked Devices</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Tap <strong className="text-slate-900">Link a Device</strong> and point your camera at the QR code on the right.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Proceed Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onAuthenticateAndProceed}
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Proceed to Admin Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* RIGHT SIDE (md:col-span-5): Automated QR Code Display */}
              <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                {whatsappStatus.qrCodeDataUrl ? (
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm relative group">
                    <img
                      src={whatsappStatus.qrCodeDataUrl}
                      alt="Automated WhatsApp Pairing QR Code"
                      className="w-48 h-48 object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow">
                        Point Camera at Screen
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <span className="text-xs text-slate-600 font-bold">
                      Generating QR Code...
                    </span>
                  </div>
                )}

                {/* Automated Refresh Indicator Badge */}
                <div className="w-full bg-white rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Auto-refresh active</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                    {countdown}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-slate-400 font-medium">
          Protected Administrator Portal • God-First Financial System
        </p>
      </div>
    </div>
  );
};
