import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, ShieldCheck, CheckCircle2, RefreshCw, ArrowRight, Lock, Cross, Copy, Check, KeyRound } from 'lucide-react';
import { WhatsAppStatus } from '../types';

interface WhatsAppGatewayProps {
  whatsappStatus: WhatsAppStatus;
  onConnectWhatsApp: () => void;
  onConfirmPair: (phone?: string) => Promise<void> | void;
  onRequestPairingCode?: (phone: string) => Promise<any>;
  onAuthenticateAndProceed: () => void;
}

const REFRESH_INTERVAL_SECONDS = 25;

export const WhatsAppGateway: React.FC<WhatsAppGatewayProps> = ({
  whatsappStatus,
  onConnectWhatsApp,
  onConfirmPair,
  onRequestPairingCode,
  onAuthenticateAndProceed,
}) => {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
  const [pairMode, setPairMode] = useState<'code' | 'qr'>('code');
  const [phoneNumber, setPhoneNumber] = useState('27829108820');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const isConnected = whatsappStatus.status === 'CONNECTED';

  // Automated QR Code Generation on mount
  useEffect(() => {
    if (!isConnected && !whatsappStatus.qrCodeDataUrl) {
      onConnectWhatsApp();
    }
  }, [isConnected]);

  // Automated QR Code Auto-Refresh Timer
  useEffect(() => {
    if (isConnected || pairMode !== 'qr') return;

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
  }, [isConnected, pairMode, onConnectWhatsApp]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsGeneratingCode(true);
    try {
      if (onRequestPairingCode) {
        await onRequestPairingCode(phoneNumber);
      } else {
        await onConfirmPair(`+${phoneNumber.replace(/[^0-9]/g, '')}`);
      }
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
            Admin Access & Session Link
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-medium leading-relaxed">
            Log in directly with one phone or pair WhatsApp for automated member statement dispatches.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          
          {/* TOP PRIMARY OPTION: Instant Single-Phone Direct Access */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Logging in from 1 Phone?</h4>
                <p className="text-xs text-slate-600">Proceed straight to dashboard without needing a 2nd device.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onAuthenticateAndProceed}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
            >
              <span>Proceed to Dashboard</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Admin Rights Notice Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-700 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block text-slate-900">Administrator Controls Active</span>
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
            /* Disconnected State: Choice between Single-Phone Pairing Code vs 2-Device QR Code */
            <div className="space-y-5">
              {/* Pairing Mode Selector */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPairMode('code')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    pairMode === 'code'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>1 Phone (Pairing Code)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPairMode('qr')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    pairMode === 'qr'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>2nd Device (QR Code)</span>
                </button>
              </div>

              {pairMode === 'code' ? (
                /* SINGLE-PHONE PAIRING CODE MODE */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                  <div className="md:col-span-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-amber-600" />
                        Single-Phone WhatsApp Linking
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Enter your phone number to get an 8-digit code. You can enter this code directly inside WhatsApp on this phone!
                      </p>
                    </div>

                    <form onSubmit={handleRequestCode} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone Number</label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 27829108820"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isGeneratingCode}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingCode ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <KeyRound className="w-4 h-4" />
                        )}
                        <span>Get 8-Digit Pairing Code</span>
                      </button>
                    </form>
                  </div>

                  <div className="md:col-span-6 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                    {whatsappStatus.pairingCode ? (
                      <div className="space-y-2 w-full">
                        <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Your 8-Digit Code</span>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <span className="text-2xl font-mono font-extrabold text-amber-900 tracking-widest">
                            {whatsappStatus.pairingCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(whatsappStatus.pairingCode || '')}
                          className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                        </button>
                        <ol className="text-[11px] text-slate-600 text-left space-y-1 pt-2 font-medium">
                          <li>1. Open WhatsApp on this phone</li>
                          <li>2. Go to <strong>Settings &gt; Linked Devices</strong></li>
                          <li>3. Tap <strong>Link with phone number instead</strong> &amp; paste code!</li>
                        </ol>
                      </div>
                    ) : (
                      <div className="py-6 space-y-2">
                        <KeyRound className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium max-w-xs">
                          Enter your phone number on the left to generate your single-phone pairing code.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* QR CODE MODE (Requires 2nd device) */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      Scan QR Code (Requires 2 Devices)
                    </h3>
                    <ol className="text-xs text-slate-600 space-y-2.5 font-medium list-none">
                      <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Open <strong className="text-slate-900">WhatsApp</strong> on your mobile phone.</span>
                      </li>
                      <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Tap <strong className="text-slate-900">Linked Devices &gt; Link a Device</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Point camera at the QR code on the right.</span>
                      </li>
                    </ol>
                  </div>

                  <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                    {whatsappStatus.qrCodeDataUrl ? (
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm relative group">
                        <img
                          src={whatsappStatus.qrCodeDataUrl}
                          alt="Automated WhatsApp Pairing QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 rounded-2xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center space-y-2">
                        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                        <span className="text-xs text-slate-600 font-bold">Generating QR Code...</span>
                      </div>
                    )}
                    <div className="w-full bg-white rounded-xl p-2 border border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="text-[11px] text-slate-600">Auto-refresh active</span>
                      <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">{countdown}s</span>
                    </div>
                  </div>
                </div>
              )}
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
