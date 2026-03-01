import React from "react";
import { X, Plus } from "lucide-react";
import { motion } from "motion/react";
import { Member, Transaction } from "../types";
import { cn } from "../utils";

interface StatementModalProps {
  isOpen: boolean;
  member: Member | null;
  transactions: Transaction[];
  onClose: () => void;
}

export default function StatementModal({ isOpen, member, transactions, onClose }: StatementModalProps) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Statement of Account</h3>
            <p className="text-gray-500 font-medium">{member.name} • {member.phone}</p>
            {member.location_info && (
              <p className="mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block border border-amber-100">
                📍 Recovery: {member.location_info}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Total Savings</p>
            <p className="text-2xl font-black text-emerald-700">M{(member.savings || 0).toLocaleString()}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Current Loan</p>
            <p className="text-2xl font-black text-amber-700">M{(member.current_loan || 0).toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Total Verified</p>
            <p className="text-2xl font-black text-blue-700">
              {transactions.filter(t => t.member_phone === member.phone && t.status === 'verified').length} Trans.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-left border-b border-gray-100">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ref</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.filter(t => t.member_phone === member.phone).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">No transactions found for this member.</td>
                </tr>
              ) : (
                transactions
                  .filter(t => t.member_phone === member.phone)
                  .map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          t.type === 'saving' ? 'text-emerald-600' : 'text-amber-600'
                        )}>{t.type}</span>
                      </td>
                      <td className="py-4 font-black">M{t.amount.toLocaleString()}</td>
                      <td className="py-4 text-xs font-mono text-gray-400">{t.proof_ref}</td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                          t.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        )}>{t.status}</span>
                      </td>
                      <td className="py-4 text-xs text-gray-400 font-bold">
                        {new Date(t.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Plus size={16} className="rotate-45" /> {/* Using Plus as a placeholder for print icon if not available */}
            Download PDF (Print)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
