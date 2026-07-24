import React, { useState, useRef } from 'react';
import { Search, UserPlus, Edit, ArrowLeftRight, Phone, Calendar, Wallet, CreditCard, X, Check, Download, Upload, FileSpreadsheet, Trash2, AlertTriangle } from 'lucide-react';
import { Member } from '../types';
import { exportMembersToCSV, parseMembersCSV } from '../utils/csv';

interface MembersViewProps {
  members: Member[];
  onAddMember: (memberData: Omit<Member, 'id' | 'joined_date'>) => Promise<void>;
  onEditMember: (id: string, memberData: Partial<Member>) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onNavigateToTransact: (memberId: string) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onNavigateToTransact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+27',
    phoneLocal: '',
    savings: '',
    current_loan: '',
    notes: '',
  });

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
  );

  const parsePhone = (phoneStr: string) => {
    if (phoneStr.startsWith('+266')) {
      return { code: '+266', local: phoneStr.replace('+266', '').trim() };
    }
    return { code: '+27', local: phoneStr.replace(/^\+27\s?/, '').trim() };
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      countryCode: '+27',
      phoneLocal: '',
      savings: '0',
      current_loan: '0',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    const parsed = parsePhone(member.phone);
    setFormData({
      name: member.name,
      countryCode: parsed.code,
      phoneLocal: parsed.local,
      savings: member.savings.toString(),
      current_loan: member.current_loan.toString(),
      notes: member.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseMembersCSV(text);
      if (parsed.length === 0) {
        setImportStatus('No valid member records found in CSV.');
        setTimeout(() => setImportStatus(null), 4000);
        return;
      }

      let count = 0;
      for (const m of parsed) {
        await onAddMember(m);
        count++;
      }

      setImportStatus(`Successfully imported ${count} members from CSV.`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err) {
      console.error('CSV import error:', err);
      setImportStatus('Failed to process CSV file.');
      setTimeout(() => setImportStatus(null), 4000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phoneLocal.trim()) return;

    const fullPhone = `${formData.countryCode} ${formData.phoneLocal.trim()}`;

    if (editingMember) {
      await onEditMember(editingMember.id, {
        name: formData.name,
        phone: fullPhone,
        savings: Number(formData.savings) || 0,
        current_loan: Number(formData.current_loan) || 0,
        notes: formData.notes,
      });
    } else {
      await onAddMember({
        name: formData.name,
        phone: fullPhone,
        savings: Number(formData.savings) || 0,
        current_loan: Number(formData.current_loan) || 0,
        notes: formData.notes,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Hidden File Input for CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* Top Search & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member name or phone (+27 / +266)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-xs transition-all"
          />
        </div>

        {/* Responsive 3-Button Action Grid that fits mobile screens perfectly without horizontal scrolling */}
        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import member roster from CSV file"
            className="px-2.5 sm:px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-bold text-[11px] sm:text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Import CSV</span>
          </button>

          <button
            onClick={() => exportMembersToCSV(members)}
            title="Export member roster to CSV"
            className="px-2.5 sm:px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-bold text-[11px] sm:text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-2.5 sm:px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Add Member</span>
          </button>
        </div>
      </div>

      {/* Import Toast Banner */}
      {importStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{importStatus}</span>
          <button onClick={() => setImportStatus(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scannable iOS Member List */}
      <div className="space-y-3">
        {filteredMembers.map((member) => {
          const initials = member.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          const netPosition = member.savings - member.current_loan;

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/70 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Member Basic Info */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 font-extrabold text-sm flex items-center justify-center shrink-0 border border-slate-200/60 shadow-inner">
                  {initials}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {member.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      <span>{member.phone.startsWith('+266') ? '🇱🇸' : '🇿🇦'}</span>
                      <span>{member.phone}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      Joined {member.joined_date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balances & Action Pills */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Savings Pill */}
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-1.5 text-right">
                  <span className="text-[10px] font-semibold text-emerald-700 block uppercase tracking-wider">
                    Savings
                  </span>
                  <span className="text-xs font-bold text-emerald-900">
                    R {member.savings.toLocaleString('en-ZA')}
                  </span>
                </div>

                {/* Active Loan Pill */}
                <div
                  className={`border rounded-xl px-3 py-1.5 text-right ${
                    member.current_loan > 0
                      ? 'bg-amber-50 border-amber-200/80 text-amber-900'
                      : 'bg-slate-50 border-slate-200/60 text-slate-600'
                  }`}
                >
                  <span className="text-[10px] font-semibold block uppercase tracking-wider opacity-80">
                    Active Loan
                  </span>
                  <span className="text-xs font-bold">
                    R {member.current_loan.toLocaleString('en-ZA')}
                  </span>
                </div>

                {/* Transact & Management Buttons */}
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={() => onNavigateToTransact(member.id)}
                    title="Record Transaction"
                    className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 text-xs font-semibold px-3"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Transact</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(member)}
                    title="Edit Member Details"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setMemberToDelete(member)}
                    title="Delete Member"
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 space-y-2 border border-slate-200/60">
            <p className="text-sm font-medium">No members match your search filter.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Member Info' : 'Add New Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grace Nkosi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Phone Number (WhatsApp)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="px-2.5 sm:px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-400 shrink-0"
                  >
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+266">🇱🇸 +266</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="82 000 0000"
                    value={formData.phoneLocal}
                    onChange={(e) => setFormData({ ...formData, phoneLocal: e.target.value })}
                    className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Current Savings (R)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.savings}
                    onChange={(e) => setFormData({ ...formData, savings: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Current Loan (R)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_loan}
                    onChange={(e) => setFormData({ ...formData, current_loan: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Notes / Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Founding member"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {editingMember ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setMemberToDelete(editingMember);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                  >
                    Save Member
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Delete Member?</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Are you sure you want to permanently remove <strong className="text-slate-800">{memberToDelete.name}</strong> ({memberToDelete.phone}) from the group roster?
              </p>
              {(memberToDelete.savings > 0 || memberToDelete.current_loan > 0) && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 text-left font-semibold">
                  ⚠️ Note: Member has R {memberToDelete.savings.toLocaleString('en-ZA')} in savings and R {memberToDelete.current_loan.toLocaleString('en-ZA')} in active loans. Deleting will update total group calculations immediately.
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  await onDeleteMember(memberToDelete.id);
                  setIsDeleting(false);
                  setMemberToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md flex items-center justify-center gap-1"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
