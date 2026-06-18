"use client";

import { useState } from "react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import api from "@/lib/axiosIns";
import { Key, LogOut, Shield, User } from "lucide-react";
import ThemeSwitcher from "@/shared/components/ThemeSwitcher";
import FontSizeControl from "@/shared/components/FontSizeControl";

export default function SettingsPage() {
  usePageTitle("Settings");
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.put("/users/profile", profile);
      setMessage("Profile updated successfully!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setMessage(e.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const initial = user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="app-page-narrow py-8 pb-12 px-4">
        <h1 className="mb-6 text-2xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
          Settings
        </h1>

      {message && (
        <div
          className={`mb-4 rounded-[6px] border p-4 text-sm ${message.includes("success")
              ? "border-[#C3DFC1] bg-[#EDF3EC] text-[#346538] dark:border-[rgba(52,101,56,0.18)] dark:bg-[rgba(52,101,56,0.12)] dark:text-[#6DB374]"
              : "border-[#F5C6C7] bg-[#FDEBEC] text-[#9F2F2D] dark:border-[rgba(159,47,45,0.18)] dark:bg-[rgba(159,47,45,0.12)] dark:text-[#F87171]"
            }`}
        >
          {message}
        </div>
      )}

      <div className="workspace-panel mb-6 rounded-[8px] border border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#252525]">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#111111] dark:text-[#E8E8E7]">
          <User className="h-5 w-5 text-[#2563EB] dark:text-[#3B82F6]" />
          Profile
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB] text-2xl font-bold text-white dark:bg-[#3B82F6]">
              {initial}
            </div>
            <div>
              <p className="font-medium text-[#111111] dark:text-[#E8E8E7]">{user?.fullName || "User"}</p>
              <p className="text-sm text-[#787774] dark:text-[#9B9A97]">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#787774] dark:text-[#9B9A97]">Full Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              className="w-full rounded-[6px] border border-[#EAEAEA] bg-white px-4 py-2.5 text-[#111111] outline-none transition-colors focus:border-[#2563EB] dark:border-white/[0.06] dark:bg-[#2A2A2A] dark:text-[#E8E8E7] dark:focus:border-[#3B82F6]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#787774] dark:text-[#9B9A97]">Email</label>
            <input
              type="email"
              value={profile.email}
              className="w-full cursor-not-allowed rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-2.5 text-[#ABABAB] dark:border-white/[0.06] dark:bg-[#2A2A2A] dark:text-[#6B6B6B]"
              disabled
            />
            <p className="mt-1 text-xs text-[#ABABAB] dark:text-[#6B6B6B]">Email cannot be changed</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-[6px] bg-[#2563EB] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-panel mb-6 rounded-[8px] border border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#252525]">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#111111] dark:text-[#E8E8E7]">
          <Shield className="h-5 w-5 text-[#2563EB] dark:text-[#3B82F6]" />
          Password
        </h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {user?.ssoProvider === 'google' || (user as any)?.googleId ? (
          <div className="rounded-[6px] bg-[#F9F9F8] p-4 text-sm text-[#787774] dark:bg-[#2A2A2A] dark:text-[#9B9A97]">
            Your account is linked with Google. Password management is handled directly through your Google account.
          </div>
        ) : (
          <button className="flex w-full items-center justify-between rounded-[6px] bg-[#F9F9F8] p-4 transition-colors hover:bg-[#F7F6F3] dark:bg-[#2A2A2A] dark:hover:bg-white/5">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-[#ABABAB] dark:text-[#6B6B6B]" />
              <div className="text-left">
                <p className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">
                  Change Password
                </p>
                <p className="text-xs text-[#787774] dark:text-[#9B9A97]">
                  Update your account password
                </p>
              </div>
            </div>
            <span className="text-[#ABABAB] dark:text-[#6B6B6B]">-&gt;</span>
          </button>
        )}
      </div>

      <div className="workspace-panel mb-6 rounded-[8px] border border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#252525]">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#111111] dark:text-[#E8E8E7]">
          <LogOut className="h-5 w-5 text-[#9F2F2D] dark:text-[#F87171]" />
          Account
        </h2>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-[6px] border border-[#F5C6C7] bg-[#FDEBEC] p-4 text-[#9F2F2D] transition-colors hover:bg-[#F5C6C7]/40 dark:border-[rgba(159,47,45,0.18)] dark:bg-[rgba(159,47,45,0.12)] dark:text-[#F87171] dark:hover:bg-[rgba(159,47,45,0.18)]"
        >
          <LogOut className="h-5 w-5" />
          <div className="text-left">
            <p className="text-sm font-medium">Log out</p>
            <p className="text-xs opacity-75">Sign out of the current account</p>
          </div>
        </button>
      </div>

      <div className="mb-6">
        <ThemeSwitcher />
      </div>

      <div className="mb-6">
        <FontSizeControl />
      </div>
      </div>
    </div>
  );
}
