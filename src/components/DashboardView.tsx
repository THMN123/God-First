import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  Building2,
  Users,
  Send,
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  ShieldCheck,
  Power,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Member, Transaction, WhatsAppStatus, BatchSendResult } from '../types';
import { exportTransactionsToCSV, exportMembersToCSV } from '../utils/csv';

interface DashboardViewProps {
  members: Member[];
  transactions: Transaction[];
  whatsappStatus: WhatsAppStatus;
  batchLogs: BatchSendResult[];
  onConnectWhatsApp: () => void;
  onConfirmPair: (phone?: string) => void;
  onDisconnectWhatsApp: () => void;
  onOpenBatchModal: () => void;
  onNavigateToTransact: (memberId?: string) => void;
}

const REFRESH_INTERVAL_SECONDS = 25;

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  transactions,
  whatsappStatus,
  batchLogs,
  onConnectWhatsApp,
  onConfirmPair,
  onDisconnectWhatsApp,
  onOpenBatchModal,
  onNavigateToTransact,
}) => {
  const [pairingPhone, setPairingPhone] = useState('+27 82 910 8820');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);

  // Compute Group Summary Metrics
  const totalSavings = members.reduce((sum, m) => sum + (m.savings || 0), 0);
  const totalLoans = members.reduce((sum, m) => sum + (m.current_loan || 0), 0);
  const netCapital = totalSavings - totalLoans;
  const activeMembersCount = members.length;

  const isConnected = whatsappStatus.status === 'CONNECTED';
  const isPairing = whatsappStatus.status === 'PAIRING';

  // 1. Automated QR Code Generation on mount if missing
  useEffect(() => {
    if (!isConnected && !whatsappStatus.qrCodeDataUrl) {
      onConnectWhatsApp();
    }
  }, [isConnected]);

  // 2. Automated Auto-Refresh Timer
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
    <div className="space-y-6 pb-24">
      {/* 1. HIGH PRIORITY WHATSAPP STATEMENT ACTION BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden border border-slate-700/50">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Send className="w-3 h-3" /> Priority Action
              </span>
              <span className="text-xs text-slate-400 font-medium">
                God-First Monthly Statement
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Send Statements to All Members
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Instantly generate and broadcast personalized WhatsApp financial balance statements to all {activeMembersCount} group members.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onOpenBatchModal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5"
            >
              <Send className="w-4 h-4 fill-current stroke-1" />
              <span>Send Statements to All Members</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. GROUP TOTAL BALANCE SUMMARIES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Savings Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-tight">Group Savings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
            R {totalSavings.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Pooled Deposits
          </div>
        </div>

        {/* Total Active Loans Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-tight">Active Loans</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
            R {totalLoans.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            Out standing
          </div>
        </div>

        {/* Group Net Capital Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-tight">Net Capital</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
            R {netCapital.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            Liquidity Reserve
          </div>
        </div>

        {/* Active Members Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold tracking-tight">Group Members</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-slate-900 font-sans tracking-tight">
            {activeMembersCount} Members
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
            Active Record
          </div>
        </div>
      </div>

      {/* 3. WHATSAPP CONNECTION STATUS CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/70 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                WhatsApp Session Integration
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pair session for auto-dispatching statements
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isPairing
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isConnected
              ? 'CONNECTED'
              : isPairing
              ? 'PAIRING IN PROGRESS'
              : 'DISCONNECTED'}
          </span>
        </div>

        {/* WhatsApp Paired State */}
        {isConnected ? (
          <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Paired Phone Number: {whatsappStatus.phoneNumber}
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                Session established at{' '}
                {whatsappStatus.connectedAt
                  ? new Date(whatsappStatus.connectedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Just now'}
                . Statements will send automatically.
              </p>
            </div>
            <button
              onClick={onDisconnectWhatsApp}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <Power className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        ) : (
          /* Disconnected or Pairing State with Automated QR Code Display */
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Instructions */}
            <div className="md:col-span-7 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  How to Pair WhatsApp
                </h4>
                <ol className="text-xs text-slate-600 space-y-2 font-medium list-none">
                  <li className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Open <strong className="text-slate-900">WhatsApp</strong> on your mobile phone.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Tap <strong className="text-slate-900">Menu</strong> or <strong className="text-slate-900">Settings</strong> &gt; <strong className="text-slate-900">Linked Devices</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tap <strong className="text-slate-900">Link a Device</strong> and point your camera at the QR code on the right.
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right: Automated QR Code Display Area */}
            <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              {whatsappStatus.qrCodeDataUrl ? (
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-inner relative group">
                  <img
                    src={whatsappStatus.qrCodeDataUrl}
                    alt="WhatsApp Pairing QR Code"
                    className="w-44 h-44 object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow">
                      Point Camera
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-44 h-44 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
                  <span className="text-xs text-slate-600 font-bold">
                    Generating QR Code...
                  </span>
                </div>
              )}

              {/* Auto Refresh Status Indicator */}
              <div className="w-full bg-slate-50 rounded-xl p-2 border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Auto-refreshing</span>
                </div>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                  {countdown}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. RECENT TRANSACTIONS ACTIVITY */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Group Transactions</h3>
            <p className="text-xs text-slate-500 font-medium">Savings deposits and loan repayments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportTransactionsToCSV(transactions)}
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Ledger CSV</span>
            </button>
            <button
              onClick={() => onNavigateToTransact()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              + Transact
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {transactions.slice(0, 5).map((tx) => {
            const isDeposit = tx.type === 'SAVINGS_DEPOSIT';
            const isRepayment = tx.type === 'LOAN_REPAYMENT';
            const isIssued = tx.type === 'LOAN_ISSUED';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isDeposit
                        ? 'bg-emerald-100 text-emerald-700'
                        : isRepayment
                        ? 'bg-blue-100 text-blue-700'
                        : isIssued
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {isDeposit ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {tx.member_name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {tx.type.replace('_', ' ')} • {new Date(tx.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold block ${
                      isDeposit || isRepayment ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {isDeposit || isRepayment ? '+' : '-'} R {tx.amount.toLocaleString('en-ZA')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {tx.note || 'Recorded'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
