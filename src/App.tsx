import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  QrCode,
  LogOut,
  Plus,
  Send,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Trash2,
  X,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { cn } from "./utils";
import { Member, Transaction } from "./types";
import { useMemo } from "react";
import NavItem from "./components/NavItem";
import MobileNavItem from "./components/MobileNavItem";
import StatCard from "./components/StatCard";
import { PhoneForm, OtpForm } from "./components/AuthForms";
import MemberModal from "./components/MemberModal";
import StatementModal from "./components/StatementModal";
import GrowthInsightsModal from "./components/GrowthInsightsModal";

export default function App() {
  const [user, setUser] = useState<Member | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [view, setView] = useState<"dashboard" | "growth" | "actions" | "history" | "members" | "transactions" | "whatsapp" | "profile">("dashboard");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ firstName: "", lastName: "", phone: "", is_admin: 0, savings: 0, current_loan: 0, location_info: "" });
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);

  // Profile management state
  const [profileForm, setProfileForm] = useState({ name: "", location_info: "", savings_goal: 0 });
  const [savingProfile, setSavingProfile] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<{ status: string; qr: string | null }>({ status: "connecting", qr: null });

  // Form states
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"saving" | "loan">("saving");

  // check cookies once on load
  useEffect(() => {
    if (!navigator.cookieEnabled) {
      setError("Cookies are disabled in your browser. Please enable them to login.");
    }
  }, []);

  // authentication + data polling effect
  useEffect(() => {
    // only run a session check when we're not already entering a code
    if (!showOtpStep && !user) {
      checkAuth();
    }

    // start polling once authenticated
    if (user) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user, showOtpStep]);

  // keep whatsapp status updated independently
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/status", { credentials: 'include' });
        const data = await res.json();
        setWhatsappStatus(data);
      } catch (e) { }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    // don't run the auth-poll while we're mid‑OTP or submitting
    if (showOtpStep || loading) return;

    try {
      const res = await fetch("/api/auth/me", { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setProfileForm({
          name: data.name || "",
          location_info: data.location_info || "",
          savings_goal: data.savings_goal || 0
        });
      } else {
        // only clear the user if we're not waiting on a code
        if (!showOtpStep) {
          setUser(null);
        }
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchData = async () => {
    console.log("[DATA] Fetching data from local API...");
    try {
      // 1. Get Members
      const memRes = await fetch('/api/members', { credentials: 'include' });
      const membersData = await memRes.json();

      // 2. Get Transactions
      const transRes = await fetch('/api/transactions', { credentials: 'include' });
      const transData = await transRes.json();

      // 3. Get WA Status
      const waRes = await fetch("/api/whatsapp/status", { credentials: 'include' });
      const waData = await waRes.json();
      setWhatsappStatus(waData);

      if (memRes.ok && membersData) {
        setMembers(membersData);
        // Find the current user in the fresh data
        const freshSelf = membersData.find((m: Member) => String(m.phone) === String(user?.phone));
        if (freshSelf) {
          console.log("[DATA] Updating local user profile from DB:", freshSelf.name);
          setUser(prev => ({ ...prev, ...freshSelf }));
        }
      } else {
        console.error("Fetch members failed:", memRes.status);
      }

      if (transRes.ok && transData) {
        setTransactions(transData);
      } else {
        console.error("Fetch transactions failed:", transRes.status);
      }

    } catch (err) {
      console.error("Fetch data failed:", err);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
        credentials: 'include'
      });
      const data = await res.json();
      console.debug("[AUTH] /request-otp", res.status, data);

      if (res.ok) {
        setSuccessMessage(data.message || "OTP Sent");
        // only show OTP step after success
        setShowOtpStep(true);
      } else {
        // display error but do not flip back to phone step – user can click
        // the "Back to Phone Number" button in the OTP form if they want to
        setError(data.error || `Failed to send OTP (${res.status})`);
        console.warn("OTP request failed", res.status, data);
      }
    } catch (err) {
      console.error("[AUTH] request-otp error", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput, code: otpInput }),
        credentials: 'include'
      });
      const data = await res.json();
      console.debug("[AUTH] /verify-otp", res.status, data);

      if (res.ok) {
        console.log("[AUTH] Login successful. SessionID from server:", data.debug_sid);
        setUser(data);
        setProfileForm({
          name: data.name || "",
          location_info: data.location_info || "",
          savings_goal: data.savings_goal || 0
        });
        // clear otp state now that we're switching to the app
        setShowOtpStep(false);
        setPhoneInput("");
        setOtpInput("");
      } else {
        setError(data.error || "Invalid code.");
      }
    } catch (err) {
      console.error("[AUTH] verify-otp error", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: 'include' });
      setUser(null);
      setShowOtpStep(false);
      setPhoneInput("");
      setOtpInput("");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullName = `${memberForm.firstName} ${memberForm.lastName}`.trim();
      if (!fullName) {
        alert("Please enter at least a first name.");
        setLoading(false);
        return;
      }

      const payload = {
        name: fullName,
        phone: memberForm.phone,
        is_admin: memberForm.is_admin,
        savings: memberForm.savings,
        current_loan: memberForm.current_loan,
        loan_repayment: memberForm.current_loan * 1.1,
        location_info: memberForm.location_info
      };

      if (isEditingMember) {
        console.log("[MEMBER] Updating member:", memberForm.phone, fullName);
        const res = await fetch(`/api/members/${memberForm.phone}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: 'include'
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update member");
        }
      } else {
        console.log("[MEMBER] Inserting new member:", memberForm.phone, fullName);
        const res = await fetch(`/api/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: 'include'
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`[${res.status}] ${errData.error || "Failed to add member"}`);
        }
      }

      setIsMemberModalOpen(false);
      await fetchData();

      // Small delay to ensure alert doesn't block UI state update
      setTimeout(() => {
        alert(`Success: Member ${isEditingMember ? 'updated' : 'added'}!`);
      }, 100);

    } catch (err: any) {
      console.error("Save member error:", err);
      alert("Error: " + (err.message || "Failed to save member"));
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = (member: Member) => {
    const nameParts = member.name.split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";

    setMemberForm({
      firstName,
      lastName,
      phone: member.phone,
      is_admin: member.is_admin,
      savings: member.savings,
      current_loan: member.current_loan,
      location_info: member.location_info || ""
    });
    setIsEditingMember(true);
    setIsMemberModalOpen(true);
  };

  const handleAddMember = () => {
    setMemberForm({ firstName: "", lastName: "", phone: "", is_admin: 0, savings: 0, current_loan: 0, location_info: "" });
    setIsEditingMember(false);
    setIsMemberModalOpen(true);
  };

  const handleViewStatement = (member: Member) => {
    setSelectedMember(member);
    setIsStatementModalOpen(true);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || (type === 'saving' && !ref)) return;

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_phone: user?.phone,
          amount: parseFloat(amount),
          type,
          proof_ref: ref,
          reason: type === 'loan' ? reason : undefined
        }),
        credentials: 'include'
      });
      if (res.ok) {
        setAmount("");
        setRef("");
        setReason("");
        fetchData();
        alert("Transaction submitted for verification!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit transaction.");
      }
    } catch (err) {
      alert("Failed to submit transaction.");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch("/api/transactions/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: 'include'
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Approval failed.");
      }
    } catch (err) {
      alert("Approval failed.");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this transaction?")) return;
    try {
      const res = await fetch("/api/transactions/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: 'include'
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Rejection failed.");
      }
    } catch (err) {
      alert("Rejection failed.");
    }
  };

  const handleDeleteMember = async (phone: string) => {
    if (!confirm("Are you sure you want to delete this member? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/members/${phone}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete member");
      }
      fetchData();
      alert("Member deleted successfully.");
    } catch (err: any) {
      alert("Error deleting member: " + err.message);
    }
  };

  const isAdmin = user?.is_admin === 1;
  const userTransactions = transactions.filter(t => t.member_phone === user?.phone);
  const pendingTransactions = transactions.filter(t => t.status === "pending");

  // Dynamic Growth Calculations
  const chartData = useMemo(() => {
    const verifiedSavings = transactions.filter(t => t.type === "saving" && t.status === "verified");

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: months[d.getMonth()],
        savings: 0
      });
    }

    // Cumulative calculation
    let total = 0;
    const sorted = [...verifiedSavings].sort((a, b) => new Date(a.timestamp || "").getTime() - new Date(b.timestamp || "").getTime());

    return last6Months.map(m => {
      const monthTotal = sorted
        .filter(t => {
          const td = new Date(t.timestamp || "");
          return td.getMonth() === m.month && td.getFullYear() === m.year;
        })
        .reduce((acc, t) => acc + (t.amount || 0), 0);

      total += monthTotal;
      return { ...m, savings: total };
    });
  }, [transactions]);

  const userMonthlyGrowth = useMemo(() => {
    if (!user) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthSavings = userTransactions
      .filter(t => {
        const d = new Date(t.timestamp || "");
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === "saving" && t.status === "verified";
      })
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const previousBalance = (user.savings || 0) - thisMonthSavings;
    if (previousBalance <= 0) return 0;
    return ((thisMonthSavings / previousBalance) * 100).toFixed(1);
  }, [user, userTransactions]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-black/5"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 relative">
              <ShieldCheck className="text-white w-8 h-8" />
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">v1.1</div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">God First</h1>
            <p className="text-gray-500 text-center mt-2">Secure Savings & Loans Management</p>
          </div>

          {!showOtpStep ? (
            <PhoneForm
              phoneInput={phoneInput}
              setPhoneInput={setPhoneInput}
              onSubmit={handleRequestOtp}
              loading={loading}
              error={error}
            />
          ) : (
            <OtpForm
              otpInput={otpInput}
              setOtpInput={setOtpInput}
              onSubmit={handleVerifyOtp}
              loading={loading}
              error={error}
              successMessage={successMessage}
              setShowOtpStep={setShowOtpStep}
              setError={setError}
              setSuccessMessage={setSuccessMessage}
            />
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">WhatsApp OTP Verification Enabled</p>

            {whatsappStatus.status !== "open" && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-2">Setup Required: Link WhatsApp</p>
                {whatsappStatus.qr ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={whatsappStatus.qr} alt="WA QR" className="w-32 h-32 rounded-lg border-2 border-white shadow-sm" />
                    <p className="text-[9px] text-amber-600 leading-tight">Scan this with WhatsApp to receive your login code.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-amber-600 py-4">
                    <div className="animate-spin w-3 h-3 border-2 border-amber-200 border-t-amber-600 rounded-full" />
                    <span className="text-[10px] font-bold">Initializing Bot...</span>
                  </div>
                )}
              </div>
            )}

            {whatsappStatus.status === "open" && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 py-2 rounded-xl">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest">WhatsApp Bot Online</span>
              </div>
            )}
            <p className="text-[9px] text-emerald-600 mt-6 uppercase tracking-widest font-black bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-100 animate-pulse">Running Version: 1.1.0 (Live)</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col hidden lg:flex sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <span className="font-bold text-2xl text-gray-900 tracking-tight">God First</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem
            active={view === "dashboard"}
            onClick={() => setView("dashboard")}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem
            active={view === "growth"}
            onClick={() => setView("growth")}
            icon={<TrendingUp size={20} />}
            label="Growth"
          />
          <NavItem
            active={view === "actions"}
            onClick={() => setView("actions")}
            icon={<Plus size={20} />}
            label="Transact"
          />
          <NavItem
            active={view === "history"}
            onClick={() => setView("history")}
            icon={<Clock size={20} />}
            label="History"
          />
          <NavItem
            active={view === "profile"}
            onClick={() => setView("profile")}
            icon={<ShieldCheck size={20} />}
            label="My Profile"
          />
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Tools</p>
              </div>
              <NavItem
                active={view === "members"}
                onClick={() => setView("members")}
                icon={<Users size={20} />}
                label="Members"
              />
              <NavItem
                active={view === "transactions"}
                onClick={() => setView("transactions")}
                icon={<ArrowUpRight size={20} />}
                label="Approvals"
                badge={pendingTransactions.length > 0 ? pendingTransactions.length : undefined}
              />
              <NavItem
                active={view === "whatsapp"}
                onClick={() => setView("whatsapp")}
                icon={<QrCode size={20} />}
                label="WhatsApp Bot"
              />
            </>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 p-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
              {user.name ? user.name.charAt(0) : '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.phone}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 p-4 md:p-8 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {view === "dashboard" && "Overview"}
                {view === "growth" && "Growth"}
                {view === "actions" && "Transact"}
                {view === "history" && "History"}
                {view === "members" && "Members"}
                {view === "transactions" && "Approvals"}
                {view === "whatsapp" && "WhatsApp"}
                {view === "profile" && "My Profile"}
              </h2>
              <p className="text-gray-500 font-medium">Welcome back, {user.name}</p>
            </div>
            <button
              onClick={() => setView("profile")}
              className="lg:hidden w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 hover:scale-105 active:scale-95 transition-transform"
            >
              <ShieldCheck className="text-white w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2",
              whatsappStatus.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}>
              <div className={cn("w-2 h-2 rounded-full", whatsappStatus.status === "open" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              Bot: {whatsappStatus.status}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Total Savings"
                  value={`M${(user.savings || 0).toLocaleString()}`}
                  icon={<Wallet className="text-emerald-600" />}
                  progress={user.savings_goal ? (user.savings / user.savings_goal) * 100 : 0}
                  subtitle={user.savings_goal ? `Goal: M${user.savings_goal.toLocaleString()}` : "No goal set"}
                />
                <StatCard
                  title="Active Loan"
                  value={`M${(user.current_loan || 0).toLocaleString()}`}
                  icon={<ArrowUpRight className="text-amber-600" />}
                  subtitle={`Repayment (+10%): M${((user.current_loan || 0) * 1.1).toLocaleString()}`}
                />
                <StatCard
                  title="Group Standing"
                  value={`#${[...members].sort((a, b) => (b.savings || 0) - (a.savings || 0)).findIndex(m => m.phone === user.phone) + 1}`}
                  icon={<TrendingUp className="text-blue-600" />}
                  trend={`${members.length > 0 ? ((user.savings / (members.reduce((acc, m) => acc + (m.savings || 0), 0) || 1)) * 100).toFixed(1) : 0}% share`}
                  subtitle="Rank based on total savings"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setView("growth")}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <TrendingUp size={24} />
                    </div>
                    <ArrowUpRight className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2">View Growth</h3>
                  <p className="text-gray-500 text-sm">Analyze your savings performance and group trends.</p>
                </button>

                <button
                  onClick={() => setView("actions")}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                      <Plus size={24} />
                    </div>
                    <ArrowUpRight className="text-gray-300 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2">Transact Now</h3>
                  <p className="text-gray-500 text-sm">Deposit savings or request a new loan quickly.</p>
                </button>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tight">Recent Activity</h3>
                  <button onClick={() => setView("history")} className="text-emerald-600 font-bold text-sm hover:underline">View History</button>
                </div>
                <div className="space-y-4">
                  {userTransactions.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          t.type === "saving" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        )}>
                          {t.type === "saving" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 capitalize">{t.type}</p>
                          <p className="text-xs text-gray-500">{new Date(t.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">M{t.amount.toLocaleString()}</p>
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          t.status === "verified" ? "text-emerald-600" : "text-amber-600"
                        )}>{t.status}</p>
                      </div>
                    </div>
                  ))}
                  {userTransactions.length === 0 && <p className="text-center text-gray-400 py-4">No recent activity</p>}
                </div>
              </div>
            </motion.div>
          )}

          {view === "growth" && (
            <motion.div
              key="growth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black tracking-tight">Savings Growth</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Performance</span>
                  </div>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setIsGrowthModalOpen(true)}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-gray-900">Monthly Breakdown</h4>
                    <ArrowUpRight className="text-gray-300 group-hover:text-emerald-600 transition-colors" size={20} />
                  </div>
                  <div className="space-y-4">
                    {chartData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="text-gray-500 font-bold">{d.name}</span>
                        <div className="flex-1 mx-4 h-2 bg-gray-50 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (d.savings / Math.max(1, (chartData[chartData.length - 1]?.savings || 7000))) * 100)}%` }} />
                        </div>
                        <span className="font-black text-gray-900">M{(d.savings || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    Click for deep insights <ArrowUpRight size={12} />
                  </p>
                </button>
                <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100">
                  <TrendingUp size={48} className="mb-6 opacity-50" />
                  <h4 className="text-2xl font-black mb-2">{Number(userMonthlyGrowth) > 0 ? "On Track!" : "Keep Going!"}</h4>
                  <p className="opacity-80 leading-relaxed">
                    {Number(userMonthlyGrowth) > 0
                      ? `Your savings have grown by ${userMonthlyGrowth}% this month. Great job staying committed!`
                      : "Start saving this month to see your growth percentage and stay on track for your goals."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === "actions" && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-black tracking-tight mb-8 text-center">New Transaction</h3>
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setType("saving")}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all",
                      type === "saving" ? "border-emerald-500 bg-emerald-50/50" : "border-gray-50 hover:border-emerald-100"
                    )}
                  >
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Plus size={24} />
                    </div>
                    <span className="font-black text-gray-900">Deposit</span>
                  </button>
                  <button
                    onClick={() => setType("loan")}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all",
                      type === "loan" ? "border-amber-500 bg-amber-50/50" : "border-gray-50 hover:border-amber-100"
                    )}
                  >
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <ArrowUpRight size={24} />
                    </div>
                    <span className="font-black text-gray-900">Loan</span>
                  </button>
                </div>

                <form onSubmit={handleSubmitTransaction} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Amount to {type === 'saving' ? 'Deposit' : 'Borrow'}</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-xl">M</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full pl-12 pr-5 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-black text-2xl"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {type === 'saving' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">M-Pesa Reference ID</label>
                      <input
                        type="text"
                        placeholder="Enter the 10-digit code"
                        className="w-full px-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-lg"
                        value={ref}
                        onChange={(e) => setRef(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {type === 'loan' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Reason for Loan</label>
                        <textarea
                          placeholder="What is this loan for? (e.g. Business expansion, school fees...)"
                          className="w-full px-6 py-4 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold min-h-[100px]"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          required
                        />
                      </div>
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-xs font-bold text-amber-700">
                          ⚖️ <span className="uppercase tracking-wider">SACCO Rule</span>: Your maximum eligible loan is 3x your current savings.
                        </p>
                        <p className="text-lg font-black text-amber-900 mt-1">
                          Max: M{((user?.savings || 0) * 3).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <div className="flex items-start gap-3 text-gray-500 text-sm">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p>Your transaction will be verified by the Treasurer. You will receive a WhatsApp notification once approved.</p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl shadow-gray-200 text-lg"
                  >
                    <Send size={20} />
                    Confirm {type === 'saving' ? 'Deposit' : 'Request'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight">Transaction History</h3>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">All</button>
                    <button className="px-4 py-2 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-400">Savings</button>
                    <button className="px-4 py-2 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-400">Loans</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {userTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                            <Clock size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="font-bold">No transactions found</p>
                          </td>
                        </tr>
                      ) : (
                        userTransactions.map(t => (
                          <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  t.type === "saving" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                )}>
                                  {t.type === "saving" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black capitalize text-gray-900">{t.type}</span>
                                  {t.reason && <span className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">{t.reason}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 font-black text-gray-900 text-lg">M{t.amount.toLocaleString()}</td>
                            <td className="px-8 py-6 text-gray-500 font-mono text-sm tracking-tighter">{t.proof_ref}</td>
                            <td className="px-8 py-6">
                              <span className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                t.status === "verified" ? "bg-emerald-100 text-emerald-700" :
                                  t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                              )}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-gray-400 font-bold text-sm">
                              {new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === "transactions" && isAdmin && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h3 className="text-lg font-bold">Pending Approvals</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {pendingTransactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                      <p>All caught up! No pending transactions.</p>
                    </div>
                  ) : (
                    pendingTransactions.map(t => (
                      <div key={t.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                            t.type === "saving" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {t.type === "saving" ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-gray-900 text-lg leading-none">{t.member_name}</p>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                t.type === 'saving' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              )}>{t.type}</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900 mb-2">M{t.amount.toLocaleString()}</p>

                            {t.reason && (
                              <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-600">
                                "{t.reason}"
                              </div>
                            )}

                            <div className="flex flex-wrap gap-4 text-xs font-bold">
                              <div className="text-gray-400">
                                <span className="uppercase tracking-wider">Ref:</span> <span className="text-gray-600 font-mono">{t.proof_ref}</span>
                              </div>
                              {t.type === 'loan' && t.member_savings_at_time !== undefined && (
                                <div className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                  <span className="uppercase tracking-wider opacity-60">Savings at Request:</span> M{t.member_savings_at_time.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-center md:self-start pt-2">
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                          >
                            <CheckCircle2 size={18} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            className="px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === "members" && isAdmin && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">Group Members</h3>
                <button
                  onClick={handleAddMember}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  <Plus size={18} />
                  Add Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                  <div key={member.phone} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Users size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center font-bold text-xl text-gray-600">
                        {member.name ? member.name.charAt(0) : '?'}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-gray-900 text-lg truncate">{member.name || 'Unknown'}</h4>
                        <p className="text-sm text-gray-500">{member.phone}</p>
                        {member.is_admin === 1 && (
                          <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Admin</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Savings</p>
                        <p className="font-bold text-emerald-600">M{(member.savings || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Loan</p>
                        <p className="font-bold text-amber-600">M{(member.current_loan || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewStatement(member)}
                        className="flex-1 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                      >
                        Statement
                      </button>
                      <button
                        onClick={() => handleEditMember(member)}
                        className="px-4 py-2 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        Edit
                      </button>
                      {member.phone !== user.phone && (
                        <button
                          onClick={() => handleDeleteMember(member.phone)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete Member"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center mb-10">
                  <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center font-black text-3xl text-gray-400 mb-4 border-4 border-white shadow-xl">
                    {user.name.charAt(0)}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">{user.name}</h3>
                  <p className="text-gray-500 font-bold">{user.phone}</p>
                </div>

                {isAdmin && (
                  <div className="mb-10 grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Admin Dashboard</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setView("transactions")}
                        className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col items-center gap-3 hover:bg-emerald-100 transition-all text-center relative"
                      >
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                          <CheckCircle2 size={20} />
                        </div>
                        <span className="text-sm font-black text-emerald-900">Approvals</span>
                        {pendingTransactions.length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">
                            {pendingTransactions.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setView("members")}
                        className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col items-center gap-3 hover:bg-blue-100 transition-all text-center"
                      >
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                          <Users size={20} />
                        </div>
                        <span className="text-sm font-black text-blue-900">Members</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setView("whatsapp")}
                      className="w-full p-4 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-3 hover:bg-gray-100 transition-all"
                    >
                      <QrCode size={18} className="text-gray-600" />
                      <span className="text-sm font-black text-gray-900">WhatsApp Gateway</span>
                    </button>
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingProfile(true);
                  try {
                    const res = await fetch("/api/profile", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(profileForm),
                      credentials: 'include'
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      setUser(prev => ({ ...prev, ...updated }));
                      alert("Profile updated successfully!");
                    }
                  } catch (err) {
                    alert("Failed to update profile.");
                  } finally {
                    setSavingProfile(false);
                  }
                }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Savings Goal (M)</label>
                      <input
                        type="number"
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold"
                        value={profileForm.savings_goal}
                        onChange={(e) => setProfileForm({ ...profileForm, savings_goal: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Location Details (Where to find you)</label>
                    <textarea
                      placeholder="Be specific: Physical address, place of work, or family contact details to ensure accountability..."
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold min-h-[120px]"
                      value={profileForm.location_info}
                      onChange={(e) => setProfileForm({ ...profileForm, location_info: e.target.value })}
                    />
                  </div>

                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-700 mb-4">Loan Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-blue-600">Principal Amount</span>
                        <span className="font-black text-blue-900">M{(user.current_loan || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-blue-600">Interest (10%)</span>
                        <span className="font-black text-blue-900">M{((user.current_loan || 0) * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="pt-3 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-sm font-black text-blue-700 uppercase">Total Repayment</span>
                        <span className="text-xl font-black text-blue-900">M{((user.current_loan || 0) * 1.1).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full bg-gray-900 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50"
                  >
                    {savingProfile ? "Saving..." : "Update Profile"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === "whatsapp" && isAdmin && (
            <motion.div
              key="whatsapp"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  <QrCode size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">WhatsApp Gateway</h3>
                <p className="text-gray-500 mb-8">Link your phone to enable automated notifications for members.</p>

                {whatsappStatus.status === "qr" && whatsappStatus.qr ? (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-3xl border-4 border-emerald-500 inline-block shadow-2xl">
                      <img src={whatsappStatus.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl text-amber-800 text-sm flex items-start gap-3 text-left max-w-md mx-auto">
                      <AlertCircle className="shrink-0 mt-0.5" size={18} />
                      <p>Scan this code with your WhatsApp (Settings {">"} Linked Devices) to start the bot.</p>
                    </div>
                  </div>
                ) : whatsappStatus.status === "open" ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 inline-block">
                      <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
                      <p className="text-emerald-800 font-bold text-xl">Bot is Online</p>
                      <p className="text-emerald-600 text-sm mb-6">Members are receiving notifications.</p>

                      <button
                        onClick={async () => {
                          const res = await fetch("/api/admin/send-summaries", {
                            method: "POST",
                            credentials: 'include'
                          });
                          try {
                            if (res.ok) {
                              const data = await res.json();
                              alert(`Summaries sent successfully! (Sent: ${data.sent}, Failed: ${data.failed})`);
                            } else {
                              const contentType = res.headers.get("content-type");
                              if (contentType && contentType.includes("application/json")) {
                                const data = await res.json();
                                alert(`Failed: ${data.error || "Unknown error"}`);
                              } else {
                                const text = await res.text();
                                alert(`Failed (Status ${res.status}): ${text.substring(0, 100)}`);
                              }
                            }
                          } catch (err) {
                            console.error("Summary blast response parse error:", err);
                            alert("Failed to process server response.");
                          }
                        }}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Send size={18} />
                        Send Monthly Summaries
                      </button>
                    </div>
                    <button className="block mx-auto text-red-600 font-bold hover:underline">Disconnect Bot</button>
                  </div>
                ) : (
                  <div className="p-12">
                    <div className="animate-spin w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Initializing connection...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MemberModal
        isOpen={isMemberModalOpen}
        isEditing={isEditingMember}
        memberForm={memberForm}
        setMemberForm={setMemberForm}
        loading={loading}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
      />

      <StatementModal
        isOpen={isStatementModalOpen}
        member={selectedMember}
        transactions={transactions}
        onClose={() => setIsStatementModalOpen(false)}
      />

      <GrowthInsightsModal
        isOpen={isGrowthModalOpen}
        onClose={() => setIsGrowthModalOpen(false)}
      />

      {/* Bottom Navbar for Mobile */}
      <div className="lg:hidden fixed bottom-8 left-0 right-0 px-6 z-50">
        <nav className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] px-4 py-3 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <MobileNavItem
            active={view === "dashboard"}
            onClick={() => setView("dashboard")}
            icon={<LayoutDashboard size={22} />}
            label="Home"
          />
          <MobileNavItem
            active={view === "growth"}
            onClick={() => setView("growth")}
            icon={<TrendingUp size={22} />}
            label="Growth"
          />
          <MobileNavItem
            active={view === "actions"}
            onClick={() => setView("actions")}
            icon={<Plus size={22} />}
            label="Transact"
          />
          <MobileNavItem
            active={view === "history"}
            onClick={() => setView("history")}
            icon={<Clock size={22} />}
            label="History"
          />
          <MobileNavItem
            active={view === "profile"}
            onClick={() => setView("profile")}
            icon={<User size={22} />}
            label="Account"
            badge={isAdmin && pendingTransactions.length > 0 ? pendingTransactions.length : undefined}
          />
        </nav>
      </div>
    </div>
  );
}
