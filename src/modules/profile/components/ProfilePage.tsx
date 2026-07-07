"use client";

import { User, Key, AlertCircle, Loader2 } from "lucide-react";
import { useAppProfile } from "../hooks/useAppProfile";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";

export function ProfilePage() {
  const { user } = useAuth();
  const {
    profile,
    loading,
    saving,
    avatarUploading,
    error,
    updateInfo,
    uploadAvatar,
    changePassword,
  } = useAppProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[25rem]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-[6px] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] text-[#9F2F2D] dark:text-[#F87171]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-[0.8125rem]">
            {error ?? "Could not load profile. Please try again."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-0 space-y-6">
      <h1 className="text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
        Personal profile
      </h1>

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] p-6">
        <h2 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
          Personal information
        </h2>
        <ProfileInfoForm
          profile={profile}
          saving={saving}
          avatarUploading={avatarUploading}
          onUpdateInfo={updateInfo}
          onUploadAvatar={uploadAvatar}
        />
      </div>

      <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] p-6">
        <h2 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-5 flex items-center gap-2">
          <Key className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
          Password
        </h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {user?.ssoProvider === 'google' || (user as any)?.googleId || (profile as any)?.ssoProvider === 'google' || (profile as any)?.googleId ? (
          <div className="p-3 rounded-[6px] bg-[#F9F9F8] dark:bg-[#2A2A2A] text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            Your account is linked with Google. Password management is handled directly through your Google account.
          </div>
        ) : (
          <ChangePasswordForm saving={saving} onChangePassword={changePassword} />
        )}
      </div>
    </div>
  );
}
