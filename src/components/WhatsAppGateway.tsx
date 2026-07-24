import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, ShieldCheck, CheckCircle2, RefreshCw, ArrowRight, Cross, Copy, Check, KeyRound, Globe } from 'lucide-react';
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
  const [countryCode, setCountryCode] = useState<'27' | '266'>('27');
  const [localNumber, setLocalNumber] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const isConnected = whatsappStatus.status === 'CONNECTED';

  // Automated Redirection once authenticated
  useEffect(() => {
    if (isConnected) {
      onAuthenticateAndProceed();
    }
  }, [isConnected, onAuthenticateAndProceed]);

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
        if (prev <= 1) { onConnectWhatsApp(); return REFRESH_INTERVAL_SECONDS; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected, pairMode, onConnectWhatsApp]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLocal = localNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (!cleanLocal) return;
    const fullPhone = `${countryCode}${cleanLocal}`;
    setIsGeneratingCode(true);
    try {
      if (onRequestPairingCode) {
        await onRequestPairingCode(fullPhone);
      } else {
        await onConfirmPair(`+${fullPhone}`);
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

  const getFullPhoneString = () => {
    const cleanLocal = localNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
    return `+${countryCode} ${cleanLocal}`;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">

      <div className="max-w-md w-full space-y-5">

        {/* Brand Header */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-bold text-slate-700 mb-2">
            <Cross className="w-3 h-3 text-amber-600 stroke-[2.5]" />
            <span>God-First Savings & Loans</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            WhatsApp Login
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Link your WhatsApp to access the admin portal.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">

          {/* Admin Rights Notice */}
          <div className="px-5 py-4 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-900 block">Administrator Only</span>
              <span className="text-[11px] text-amber-800/80 leading-relaxed">
                All ledger and transaction controls are restricted to the group administrator.
              </span>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* Connected State */}
            {isConnected ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-900">WhatsApp Connected!</h3>
                  <p className="text-xs text-emerald-700">Redirecting to Admin Dashboard...</p>
                </div>
                <button
                  type="button"
                  onClick={onAuthenticateAndProceed}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-5">

                {/* Segment Control */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPairMode('code')}
                    className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      pairMode === 'code'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>1 Phone (Pairing Code)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPairMode('qr')}
                    className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      pairMode === 'qr'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-600" />
                    <span>2 Devices (QR Code)</span>
                  </button>
                </div>

                {pairMode === 'code' ? (
                  /* Pairing Code Mode */
                  <div className="space-y-4">
                    <form onSubmit={handleRequestCode} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Phone Number
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value as '27' | '266')}
                            className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0"
                          >
                            <option value="27">🇿🇦 +27</option>
                            <option value="266">🇱🇸 +266</option>
                          </select>
                          <input
                            type="text"
                            value={localNumber}
                            onChange={(e) => setLocalNumber(e.target.value)}
                            placeholder="Enter your number"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isGeneratingCode}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingCode ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                        <span>Get 8-Digit Pairing Code</span>
                      </button>
                    </form>

                    {whatsappStatus.pairingCode && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="text-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Your Pairing Code</span>
                          <div className="py-3 bg-white border border-slate-200 rounded-xl">
                            <span className="text-2xl font-mono font-black text-amber-600 tracking-widest">
                              {whatsappStatus.pairingCode}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(whatsappStatus.pairingCode || '')}
                          className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'Code Copied!' : 'Copy Pairing Code'}</span>
                        </button>
                        <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                          <p>1. Copy the code above</p>
                          <p>2. Open WhatsApp → Linked Devices</p>
                          <p>3. Tap <strong className="text-slate-700">Link with phone number instead</strong></p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* QR Code Mode */
                  <div className="space-y-3">
                    <div className="text-xs text-slate-600 space-y-1.5 font-medium">
                      <p>1. Open WhatsApp on your phone</p>
                      <p>2. Go to <strong className="text-slate-800">Linked Devices → Link a Device</strong></p>
                      <p>3. Point your camera at the QR code below</p>
                    </div>
                    <div className="flex flex-col items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      {whatsappStatus.qrCodeDataUrl ? (
                        <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                          <img
                            src={whatsappStatus.qrCodeDataUrl}
                            alt="WhatsApp QR Code"
                            className="w-44 h-44 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-44 h-44 rounded-2xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center space-y-2">
                          <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
                          <span className="text-xs text-slate-500 font-semibold">Generating...</span>
                        </div>
                      )}
                      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Auto-refresh
                        </span>
                        <span className="font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">{countdown}s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 font-medium">
          Secure Administrator Portal • God-First Financial System
        </p>

      </div>
    </div>
  );
};
