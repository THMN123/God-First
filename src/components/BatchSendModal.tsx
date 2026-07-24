import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, X, MessageSquare, Smartphone } from 'lucide-react';
import { Member, WhatsAppStatus, BatchSendResult } from '../types';

interface BatchSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  whatsappStatus: WhatsAppStatus;
  onConfirmSendBatch: () => Promise<BatchSendResult | null>;
}

export const BatchSendModal: React.FC<BatchSendModalProps> = ({
  isOpen,
  onClose,
  members,
  whatsappStatus,
  onConfirmSendBatch,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedResult, setCompletedResult] = useState<BatchSendResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = whatsappStatus.status === 'CONNECTED';
  const totalMembers = members.length;
  const sampleMember = members[0] || {
    name: 'Grace Nkosi',
    phone: '+27 82 555 0192',
    savings: 18500,
    current_loan: 2500,
  };

  const formattedSampleSavings = `R ${sampleMember.savings.toLocaleString('en-ZA')}`;
  const formattedSampleLoan = `R ${sampleMember.current_loan.toLocaleString('en-ZA')}`;
  const sampleNet = `R ${(sampleMember.savings - sampleMember.current_loan).toLocaleString('en-ZA')}`;

  const handleStartSend = async () => {
    if (!isConnected) {
      setErrorMsg('WhatsApp session is not connected. Please pair WhatsApp on the Dashboard first.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setProgress(15);

    try {
      // Simulate progress ticks for user satisfaction
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 20 : prev));
      }, 350);

      const result = await onConfirmSendBatch();
      clearInterval(interval);

      if (result) {
        setProgress(100);
        setCompletedResult(result);
      } else {
        setErrorMsg('Failed to process WhatsApp statement batch.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error executing batch WhatsApp send.');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSending(false);
    setProgress(0);
    setCompletedResult(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Send WhatsApp Statements</h3>
              <p className="text-xs text-slate-500 font-medium">
                Batch broadcast to all {totalMembers} members
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            disabled={isSending}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {!isConnected && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">WhatsApp Disconnected:</span> Please connect WhatsApp in the Dashboard view before broadcasting statements.
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {!completedResult ? (
            <>
              {/* Sample Statement Card */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statement Preview Template
                </label>
                <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner border border-emerald-900/50 relative">
                  <div className="absolute top-2 right-3 text-[10px] text-emerald-400 font-sans font-medium px-2 py-0.5 rounded bg-emerald-900/60">
                    WhatsApp Text Format
                  </div>
                  {`🙏 *God-First Savings & Loans Group*
---------------------------------------
Member Statement for: *${sampleMember.name}*
Phone: ${sampleMember.phone}

💰 *Total Savings:* ${formattedSampleSavings}
📉 *Active Loan:* ${formattedSampleLoan}
📊 *Net Position:* ${sampleNet}

"Honor the LORD with your wealth, with the firstfruits of all your crops." - Proverbs 3:9`}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Recipients</span>
                  <span className="text-base font-bold text-slate-900">{totalMembers} Members</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <span className="text-[11px] text-slate-500 font-medium block">Sender Account</span>
                  <span className="text-base font-bold text-slate-900 truncate block">
                    {whatsappStatus.phoneNumber || 'Not Paired'}
                  </span>
                </div>
              </div>

              {/* Progress indicator during send */}
              {isSending && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      Sending statements in background...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Completed Result View */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900">Batch Dispatch Complete!</h4>
                <p className="text-xs text-emerald-700">
                  Successfully sent personalized balance statements to {completedResult.sentCount} members via WhatsApp.
                </p>
              </div>

              {/* Itemized Logs */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dispatched Members ({completedResult.logs.length})
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {completedResult.logs.map((log) => (
                    <div
                      key={log.memberId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <div>
                          <span className="font-semibold text-slate-800 block">{log.memberName}</span>
                          <span className="text-slate-400 text-[11px]">{log.phone}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                        Sent
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          {!completedResult ? (
            <>
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSending}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartSend}
                disabled={isSending || !isConnected}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to All ({totalMembers})
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
