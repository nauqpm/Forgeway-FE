"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axiosIns";
import type { AppUserProfile, UpdateProfilePayload, ChangePasswordPayload } from "../types/profile.types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function useAppProfile() {
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/users/me");
      setProfile(res.data?.data ?? res.data);
    } catch {
      setError("Could not load profile information");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateInfo = useCallback(
    async (payload: UpdateProfilePayload): Promise<{ success: boolean; fieldErrors?: Record<string, string> }> => {
      try {
        setSaving(true);
        setError(null);
        const res = await api.put("/users/me", payload);
        setProfile(res.data?.data ?? res.data);
        return { success: true };
      } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errData = (e as any)?.response?.data;
        if (errData && Array.isArray(errData.message)) {
          const fieldErrors: Record<string, string> = {};
          let genericError: string | null = null;

          errData.message.forEach((msg: string) => {
            const lowerMsg = msg.toLowerCase();
            if (lowerMsg.includes("điện thoại") || lowerMsg.includes("phone")) fieldErrors.phone = msg;
            else if (lowerMsg.includes("ngày sinh") || lowerMsg.includes("birthday")) fieldErrors.birthday = msg;
            else if (lowerMsg.includes("giới tính") || lowerMsg.includes("gender")) fieldErrors.gender = msg;
            else if (lowerMsg.includes("email")) fieldErrors.email = msg;
            else if (lowerMsg.includes("avatar") || lowerMsg.includes("ảnh")) fieldErrors.avatar = msg;
            else if (lowerMsg.includes("tên") || lowerMsg.includes("name") || lowerMsg.includes("họ"))
              fieldErrors.fullName = msg;
            else if (lowerMsg.includes("địa chỉ") || lowerMsg.includes("address")) fieldErrors.address = msg;
            else {
              if (!genericError) genericError = msg;
              else genericError += " | " + msg;
            }
          });

          if (genericError) setError(genericError);
          return { success: false, fieldErrors };
        }

        const msg = errData?.message ?? "Update failed";
        setError(msg);
        return { success: false };
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      // Client-side validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError("Only image files are accepted (JPG, PNG, GIF, WEBP)");
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Image must not exceed 10MB");
        return false;
      }

      const previousAvatar = profile?.avatar;

      try {
        setAvatarUploading(true);
        setError(null);

        // Phase 1: upload file
        const form = new FormData();
        form.append("file", file);
        const uploadRes = await api.post("/imagesapi/upload/avatar", form, {
          transformRequest: [
            (data, headers) => {
              delete headers["Content-Type"];
              return data;
            },
          ],
        });
        let avatarUrl: string = uploadRes.data?.data?.url ?? uploadRes.data?.url ?? uploadRes.data?.data?.path;

        if (!avatarUrl) {
          setError("Image upload failed because the server did not return a URL");
          return false;
        }
        if (!avatarUrl.startsWith("http") && !avatarUrl.startsWith("https")) {
          avatarUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:5512") + avatarUrl;
        }

        // Phase 2: save URL to profile
        try {
          const res = await api.put("/users/me", { avatar: avatarUrl });
          setProfile(res.data?.data ?? res.data);
          return true;
        } catch (e: unknown) {
          // Phase 2 failed — revert to old avatar in UI
          setProfile((prev) => (prev ? { ...prev, avatar: previousAvatar } : prev));
          const msg =
            (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Image uploaded but was not saved to your profile. Please try again";
          setError(msg);
          return false;
        }
      } catch {
        setError("Image upload failed");
        return false;
      } finally {
        setAvatarUploading(false);
      }
    },
    [profile?.avatar]
  );

  const changePassword = useCallback(
    async (
      payload: ChangePasswordPayload
    ): Promise<{
      success: boolean;
      fieldErrors?: Record<string, string>;
      message?: string;
    }> => {
      try {
        setSaving(true);
        setError(null);
        await api.put("/users/me", {
          currentPassword: payload.currentPassword,
          password: payload.password,
        });
        return { success: true };
      } catch (e: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errData = (e as any)?.response?.data;
        if (errData && Array.isArray(errData.message)) {
          const fieldErrors: Record<string, string> = {};
          let genericError: string | null = null;

          errData.message.forEach((msg: string) => {
            const lowerMsg = msg.toLowerCase();
            if (lowerMsg.includes("mật khẩu") || lowerMsg.includes("password")) {
              if (lowerMsg.includes("hiện tại") || lowerMsg.includes("current")) fieldErrors.currentPassword = msg;
              else fieldErrors.newPassword = msg;
            } else {
              if (!genericError) genericError = msg;
              else genericError += " | " + msg;
            }
          });

          if (genericError) setError(genericError);
          return { success: false, fieldErrors };
        }

        const msg = errData?.message ?? "Password change failed";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    profile,
    loading,
    saving,
    avatarUploading,
    error,
    updateInfo,
    uploadAvatar,
    changePassword,
    refreshProfile: fetchProfile,
  };
}
