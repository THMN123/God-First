import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Wallet, CreditCard, CheckCircle2, AlertCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Member, TransactionType } from '../types';

interface TransactViewProps {
  members: Member[];
  initialMemberId?: string;
  onSubmitTransaction: (data: {
    member_id: string;
    type: TransactionType;
    amount: number;
    note?: string;
  }) => Promise<boolean>;
}

export const TransactView: React.FC<TransactViewProps> = ({
  members,
  initialMemberId,
  onSubmitTransaction,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (members[0]?.id || '')
  );
  const [type, setType] = useState<TransactionType>('SAVINGS_DEPOSIT');
  const [amount, setAmount] = useState<string>('500');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Compute live prospective balances
  const numericAmount = Math.abs(Number(amount)) || 0;
  let prospectiveSavings = selectedMember ? selectedMember.savings : 0;
  let prospectiveLoan = selectedMember ? selectedMember.current_loan : 0;

  if (selectedMember && numericAmount > 0) {
    if (type === 'SAVINGS_DEPOSIT') {
      prospectiveSavings += numericAmount;
    } else if (type === 'LOAN_REPAYMENT') {
      prospectiveLoan = Math.max(0, prospectiveLoan - numericAmount);
    } else if (type === 'LOAN_ISSUED') {
      prospectiveLoan += numericAmount;
    } else if (type === 'SAVINGS_WITHDRAWAL') {
      prospectiveSavings = Math.max(0, prospectiveSavings - numericAmount);
    }
  }

  const handleQuickAddAmount = (addValue: number) => {
    const current = Number(amount) || 0;
    setAmount((current + addValue).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setErrorMsg('Please select a member.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    if (type === 'SAVINGS_WITHDRAWAL' && selectedMember && selectedMember.savings < numericAmount) {
      setErrorMsg('Withdrawal amount exceeds member current savings balance!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const success = await onSubmitTransaction({
      member_id: selectedMemberId,
      type,
      amount: numericAmount,
      note: note.trim() || undefined,
    });

    setIsSubmitting(false);

    if (success) {
      setSuccessMsg(
        `Transaction recorded successfully for ${selectedMember?.name}! Updated balance has been synced.`
      );
      setAmount('500');
      setNote('');
    } else {
      setErrorMsg('Failed to record transaction on backend.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/70 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Record Transaction</h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-900 text-white rounded-md">
                Admin Posting
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Post savings deposits, loan issuances, or repayments as Administrator
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Transaction Saved</span>
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Select Member */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-400"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.phone}) — Savings: R {m.savings.toLocaleString('en-ZA')} | Loan: R {m.current_loan.toLocaleString('en-ZA')}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Transaction Type Segment Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Transaction Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl">
              {[
                { id: 'SAVINGS_DEPOSIT' as TransactionType, label: 'Deposit Savings', icon: Wallet },
                { id: 'LOAN_REPAYMENT' as TransactionType, label: 'Repay Loan', icon: CreditCard },
                { id: 'LOAN_ISSUED' as TransactionType, label: 'Issue Loan', icon: ArrowUpRight },
                { id: 'SAVINGS_WITHDRAWAL' as TransactionType, label: 'Withdraw', icon: ArrowDownLeft },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-center ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Amount Input & Quick Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              3. Amount (ZAR / R)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                R
              </span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-lg font-extrabold text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[100, 250, 500, 1000, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  +R{val}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Note / Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              4. Reference / Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly contribution via EFT"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* 5. Real-Time Prospective Balance Preview Card */}
          {selectedMember && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium pb-2 border-b border-slate-800">
                <span>Updated Position Preview</span>
                <span className="text-amber-400 font-bold">{selectedMember.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Savings</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="line-through text-slate-500 font-mono">
                      R {selectedMember.savings.toLocaleString('en-ZA')}
                    </span>
                    <span className="font-extrabold text-emerald-400 text-sm font-mono">
                      R {prospectiveSavings.toLocaleString('en-ZA')}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Active Loan Balance</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="line-through text-slate-500 font-mono">
                      R {selectedMember.current_loan.toLocaleString('en-ZA')}
                    </span>
                    <span className="font-extrabold text-amber-400 text-sm font-mono">
                      R {prospectiveLoan.toLocaleString('en-ZA')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/15 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording Transaction...' : 'Submit Transaction'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
