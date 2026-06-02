"use client";

import { User, Key, AlertCircle, Loader2 } from "lucide-react";
import { useAppProfile } from "../hooks/useAppProfile";
import { ProfileInfoForm } from "./ProfileInfoForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export function ProfilePage() {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">
            {error ?? "Could not load profile. Please try again."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Personal profile
      </h1>

      {/* API error banner (non-fatal) */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" />
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

      {/* Security card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-500" />
          Privacy
        </h2>
        <ChangePasswordForm saving={saving} onChangePassword={changePassword} />
      </div>
    </div>
  );
}
