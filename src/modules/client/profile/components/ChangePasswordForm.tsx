"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import type { ChangePasswordPayload } from "../types/profile.types";
import Link from "next/link";

interface Props {
  saving: boolean;
  onChangePassword: (
    payload: ChangePasswordPayload,
  ) => Promise<{
    success: boolean;
    fieldErrors?: Record<string, string>;
    message?: string;
  }>;
}

const labelCls = "block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97]";
const inputBaseCls = "w-full px-3 py-2 pr-10 border rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:outline-none transition-colors";
const inputNormalCls = `${inputBaseCls} border-[#EAEAEA] dark:border-white/10 focus:border-[#2563EB] dark:focus:border-[#3B82F6]`;
const inputErrorCls = `${inputBaseCls} border-[#9F2F2D] focus:border-[#9F2F2D]`;

export function ChangePasswordForm({ saving, onChangePassword }: Props) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setSuccess(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setFieldErrors({});
    setSuccess(false);

    let hasClientError = false;
    const newFieldErrors: Record<string, string> = {};

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(form.newPassword)) {
      newFieldErrors.newPassword = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
      hasClientError = true;
    }

    if (form.newPassword !== form.confirmPassword) {
      newFieldErrors.confirmPassword = "Password confirmation does not match";
      hasClientError = true;
    }

    if (hasClientError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    const res = await onChangePassword({
      currentPassword: form.currentPassword,
      password: form.newPassword,
    });

    if (res.success) {
      toast.success("Password changed successfully");
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
      }
      if (res.message) {
        toast.error(res.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="p-3 rounded-[6px] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
          {validationError}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-[6px] bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] border border-[#C3DFC1] dark:border-[rgba(52,101,56,0.2)] text-[0.8125rem] text-[#346538] dark:text-[#4ADE80] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Your password has been changed successfully
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls}>Current password</label>
          <Link
            href="/forgot-password"
            className="text-[0.6875rem] text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder="Enter your current password"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
            lang="en"
            className={fieldErrors.currentPassword ? inputErrorCls : inputNormalCls}
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-colors"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.currentPassword && (
          <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
            {fieldErrors.currentPassword}
          </p>
        )}
      </div>

      <div>
        <label className={`${labelCls} mb-1.5 block`}>New password</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
            lang="en"
            className={fieldErrors.newPassword ? inputErrorCls : inputNormalCls}
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-colors"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.newPassword && (
          <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
            {fieldErrors.newPassword}
          </p>
        )}
      </div>

      <div>
        <label className={`${labelCls} mb-1.5 block`}>Confirm new password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your new password"
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect="off"
            spellCheck="false"
            lang="en"
            className={fieldErrors.confirmPassword ? inputErrorCls : inputNormalCls}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-colors"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-[6px] text-[0.8125rem] font-medium transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Change password"}
        </button>
      </div>
    </form>
  );
}
