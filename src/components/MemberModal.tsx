import React from "react";
import { X, MessageSquare, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { Member } from "../types";

interface MemberForm {
  firstName: string;
  lastName: string;
  phone: string;
  is_admin: number;
  savings: number;
  current_loan: number;
  location_info: string;
}

interface MemberModalProps {
  isOpen: boolean;
  isEditing: boolean;
  memberForm: MemberForm;
  setMemberForm: React.Dispatch<React.SetStateAction<MemberForm>>;
  loading: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export default function MemberModal({
  isOpen,
  isEditing,
  memberForm,
  setMemberForm,
  loading,
  onClose,
  onSave
}: MemberModalProps) {
  const [sendingStatus, setSendingStatus] = React.useState(false);

  if (!isOpen) return null;

  const handleSendSummary = async () => {
    setSendingStatus(true);
    try {
      const res = await fetch("/api/admin/send-member-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: memberForm.phone }),
        credentials: 'include'
      });
      if (res.ok) {
        alert("Account status sent via WhatsApp!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send summary.");
      }
    } catch (err) {
      alert("Error sending WhatsApp message.");
    } finally {
      setSendingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black tracking-tight">
            {isEditing ? 'Edit Member' : 'Add New Member'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">First Name</label>
              <input
                type="text"
                placeholder="e.g. Thabo"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                value={memberForm.firstName}
                onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Mofokeng"
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                value={memberForm.lastName}
                onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 266... or 27..."
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold disabled:opacity-50"
              value={memberForm.phone}
              onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
              required
              disabled={isEditing}
            />
            {isEditing && <p className="text-[10px] text-gray-400 italic ml-1">Phone number cannot be changed.</p>}
          </div>

          {isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Savings (M)</label>
                <input
                  type="number"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                  value={memberForm.savings}
                  onChange={(e) => setMemberForm({ ...memberForm, savings: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Loan (M)</label>
                <input
                  type="number"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                  value={memberForm.current_loan}
                  onChange={(e) => setMemberForm({ ...memberForm, current_loan: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Location Details (Accountability)</label>
            <textarea
              placeholder="Physical address, work location, or family contacts for recovery..."
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold min-h-[80px]"
              value={memberForm.location_info}
              onChange={(e) => setMemberForm({ ...memberForm, location_info: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <input
              type="checkbox"
              id="isAdmin"
              className="w-5 h-5 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500"
              checked={memberForm.is_admin === 1}
              onChange={(e) => setMemberForm({ ...memberForm, is_admin: e.target.checked ? 1 : 0 })}
            />
            <label htmlFor="isAdmin" className="text-sm font-bold text-gray-700 cursor-pointer">Grant Admin Privileges</label>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleSendSummary}
              disabled={sendingStatus}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-700 font-bold rounded-2xl border-2 border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50"
            >
              <Smartphone size={20} />
              {sendingStatus ? "Sending..." : "Send Account Status via WhatsApp"}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? "Saving..." : (isEditing ? "Update Member" : "Create Member")}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
