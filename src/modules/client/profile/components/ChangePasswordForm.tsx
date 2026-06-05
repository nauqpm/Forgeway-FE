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

    // if (!form.currentPassword) {
    //   newFieldErrors.currentPassword = "Please enter your current password";
    //   hasClientError = true;
    // }

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
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {validationError}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Your password has been changed successfully
        </div>
      )}

      {/* Current password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Current password
          </label>

          <Link
            href="/forgot-password"
            className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
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
            className={`w-full px-3 py-2.5 pr-10 border ${
              fieldErrors.currentPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
            } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2`}
          />

          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showCurrent ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {fieldErrors.currentPassword && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {fieldErrors.currentPassword}
          </p>
        )}
      </div>

      {/* New password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          New password
        </label>
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
            className={`w-full px-3 py-2.5 pr-10 border ${
              fieldErrors.newPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
            } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2`}
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showNew ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {fieldErrors.newPassword && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {fieldErrors.newPassword}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Confirm new password
        </label>
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
            className={`w-full px-3 py-2.5 pr-10 border ${
              fieldErrors.confirmPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
            } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showConfirm ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
        Note: The "Current password" field is currently only validated on the client.
        The backend needs to add validation for <code className="font-mono">currentPassword</code> trong{" "}
        <code className="font-mono">UpdateUserProfileDto</code> to ensure security.
      </p> */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Change password"}
        </button>
      </div>
    </form>
  );
}
