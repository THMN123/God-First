import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface PhoneFormProps {
  phoneInput: string;
  setPhoneInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
}

export function PhoneForm({ phoneInput, setPhoneInput, onSubmit, loading, error }: PhoneFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          placeholder="e.g. 266... or 27..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          required
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
      >
        {loading ? "Checking..." : "Send Verification Code"}
      </button>
    </form>
  );
}

interface OtpFormProps {
  otpInput: string;
  setOtpInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  successMessage: string;
  setShowOtpStep: (value: boolean) => void;
  setError: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
}

export function OtpForm({
  otpInput,
  setOtpInput,
  onSubmit,
  loading,
  error,
  successMessage,
  setShowOtpStep,
  setError,
  setSuccessMessage
}: OtpFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
        {successMessage && (
          <div className="flex items-center gap-2 text-emerald-600 text-[10px] bg-emerald-50 p-2 rounded-lg mb-2 font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} />
            {successMessage}
          </div>
        )}
        <p className="text-xs text-gray-500 mb-2">Enter the 4-digit code sent to your WhatsApp.</p>
        <input
          type="text"
          maxLength={4}
          placeholder="0000"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-[1em] font-bold"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
          required
          autoFocus
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify & Login"}
      </button>
      <button
        type="button"
        onClick={() => {
          setShowOtpStep(false);
          setSuccessMessage("");
          setError("");
        }}
        className="w-full text-sm text-gray-500 font-semibold hover:text-gray-700 transition-colors"
      >
        Back to Phone Number
      </button>
    </form>
  );
}
