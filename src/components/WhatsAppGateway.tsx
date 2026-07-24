import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, ShieldCheck, CheckCircle2, RefreshCw, ArrowRight, Lock, Cross, Copy, Check, KeyRound, Globe, Server } from 'lucide-react';
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
  const [localNumber, setLocalNumber] = useState('829108820');
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
    <div className="min-h-screen bg-[#070913] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden font-sans">
      {/* iOS 27 Fluid Mesh Gradient Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/20 blur-[140px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-amber-600/20 to-rose-600/30 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Subtle Status Bar Spacer / Header */}
      <div className="w-full max-w-lg flex items-center justify-between z-10 pt-2 opacity-80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">System Online</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold tracking-wider bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <Server className="w-3 h-3 text-amber-500" />
          <span>Render Live</span>
        </div>
      </div>

      {/* Main Glassmorphic Container */}
      <div className="max-w-lg w-full space-y-8 relative z-10 my-auto animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-slate-300">
            <Cross className="w-3.5 h-3.5 text-amber-500" />
            <span>God-First savings & loans</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans bg-clip-text bg-gradient-to-b from-white to-slate-300">
            WhatsApp Link
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
            Link WhatsApp to automate financial statement notifications for all group members.
          </p>
        </div>

        {/* Main Glass Card */}
        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] space-y-6">
          
          {/* Admin Rights Notice Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block text-amber-300">Administrator Credentials Required</span>
              <span className="opacity-80">
                You can link a device below, or tap the secure bypass button to login directly if you are not pairing today.
              </span>
            </div>
          </div>

          {/* Connected State */}
          {isConnected ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-emerald-300">WhatsApp Connected Successfully!</h3>
                <p className="text-xs text-emerald-400/80">
                  Redirecting you to the system portal...
                </p>
              </div>
              <button
                type="button"
                onClick={onAuthenticateAndProceed}
                className="w-full px-6 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-xs transition-all hover:bg-slate-200 shadow-md flex items-center justify-center gap-2 mx-auto"
              >
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          ) : (
            /* Disconnected State */
            <div className="space-y-6">
              {/* iOS-Style Segment Control */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPairMode('code')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                    pairMode === 'code'
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>1 Phone (Pairing Code)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPairMode('qr')}
                  className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                    pairMode === 'qr'
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>2 Devices (QR Code)</span>
                </button>
              </div>

              {pairMode === 'code' ? (
                /* SINGLE-PHONE PAIRING CODE */
                <div className="space-y-5">
                  <div className="space-y-4">
                    <form onSubmit={handleRequestCode} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                          <Globe className="w-3.5 h-3.5 text-amber-500" />
                          <span>Country &amp; Phone Number</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value as '27' | '266')}
                            className="px-3.5 py-3 rounded-2xl border border-white/10 bg-slate-900/60 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shrink-0"
                          >
                            <option value="27">🇿🇦 +27</option>
                            <option value="266">🇱🇸 +266</option>
                          </select>

                          <input
                            type="text"
                            value={localNumber}
                            onChange={(e) => setLocalNumber(e.target.value)}
                            placeholder="e.g. 82 910 8820"
                            className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-slate-900/60 text-xs font-mono font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isGeneratingCode}
                        className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingCode ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <KeyRound className="w-4 h-4 text-white" />
                        )}
                        <span>Get 8-Digit Pairing Code</span>
                      </button>
                    </form>
                  </div>

                  {whatsappStatus.pairingCode && (
                    <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/10 text-center space-y-4 animate-slideIn">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Linking Code</span>
                        <div className="py-3.5 bg-slate-950/60 border border-white/10 rounded-2xl text-center">
                          <span className="text-3xl font-mono font-black text-amber-500 tracking-widest">
                            {whatsappStatus.pairingCode}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(whatsappStatus.pairingCode || '')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/5"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                          <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onConfirmPair(getFullPhoneString())}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Confirm Link</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 text-left space-y-1 bg-white/[0.01] p-3 rounded-xl border border-white/5 font-medium leading-relaxed">
                        <li>1. Copy code above</li>
                        <li>2. Open WhatsApp &gt; Link a Device</li>
                        <li>3. Select <strong>Link with phone number instead</strong> &amp; paste code!</li>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* QR CODE MODE */
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                  {whatsappStatus.qrCodeDataUrl ? (
                    <div className="p-3 bg-white rounded-3xl relative group shadow-lg">
                      <img
                        src={whatsappStatus.qrCodeDataUrl}
                        alt="WhatsApp Pairing QR"
                        className="w-44 h-44 object-contain rounded-2xl"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 rounded-3xl bg-slate-950/60 border border-dashed border-white/10 flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generating...</span>
                    </div>
                  )}
                  
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-bold tracking-wider px-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-Refresh Active
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-amber-500 font-mono">{countdown}s</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECURE BYPASS LINK AT BOTTOM - iOS 27 Sleek Vibe */}
        <div className="text-center">
          <button
            type="button"
            onClick={onAuthenticateAndProceed}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-bold text-slate-400 hover:text-white transition-all hover:bg-white/10"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Bypass WhatsApp Pairing &amp; Enter Portal</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full text-center z-10 opacity-40 py-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
          Secure Administrator Portal • God-First Financial System
        </p>
      </div>
    </div>
  );
};
