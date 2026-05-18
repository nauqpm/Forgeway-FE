"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/common/services/api.service";
import type {
  AppUserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from "../types/profile.types";

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
      setError("Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateInfo = useCallback(
    async (payload: UpdateProfilePayload): Promise<boolean> => {
      try {
        setSaving(true);
        setError(null);
        const res = await api.put("/users/me", payload);
        setProfile(res.data?.data ?? res.data);
        return true;
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Cập nhật thất bại";
        setError(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      // Client-side validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)");
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Ảnh không được vượt quá 10MB");
        return false;
      }

      const previousAvatar = profile?.avatar;

      try {
        setAvatarUploading(true);
        setError(null);

        // Phase 1: upload file
        const form = new FormData();
        form.append("file", file);
        const uploadRes = await api.post("/imagesapi/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const avatarUrl: string =
          uploadRes.data?.data?.url ??
          uploadRes.data?.url ??
          uploadRes.data?.data?.path;

        if (!avatarUrl) {
          setError("Upload ảnh thất bại — server không trả về URL");
          return false;
        }

        // Phase 2: save URL to profile
        try {
          const res = await api.put("/users/me", { avatar: avatarUrl });
          setProfile(res.data?.data ?? res.data);
          return true;
        } catch (e: unknown) {
          // Phase 2 failed — revert to old avatar in UI
          setProfile((prev) =>
            prev ? { ...prev, avatar: previousAvatar } : prev,
          );
          const msg =
            (e as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ??
            "Ảnh đã upload nhưng chưa lưu vào hồ sơ — vui lòng thử lại";
          setError(msg);
          return false;
        }
      } catch {
        setError("Upload ảnh thất bại");
        return false;
      } finally {
        setAvatarUploading(false);
      }
    },
    [profile?.avatar],
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload): Promise<boolean> => {
      try {
        setSaving(true);
        setError(null);
        await api.put("/users/me", {
          currentPassword: payload.currentPassword,
          password: payload.password,
        });
        return true;
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Đổi mật khẩu thất bại";
        setError(msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
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
