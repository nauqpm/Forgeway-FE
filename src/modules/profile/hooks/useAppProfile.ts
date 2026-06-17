"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosIns";
import { queryKeys } from "@/shared/constants/queryKeys";
import type { AppUserProfile, UpdateProfilePayload, ChangePasswordPayload } from "../types/profile.types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function useAppProfile() {
  const queryClient = useQueryClient();
  const [localError, setLocalError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    data: profileData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<AppUserProfile>({
    queryKey: queryKeys.profile.detail(),
    queryFn: async () => {
      const res = await api.get("/users/me");
      return res.data?.data ?? res.data;
    },
  });

  const updateInfoMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const res = await api.put("/users/me", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail(), data);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      await api.put("/users/me", {
        currentPassword: payload.currentPassword,
        password: payload.password,
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const res = await api.put("/users/me", { avatar: avatarUrl });
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail(), data);
    },
  });

  const updateInfo = useCallback(
    async (payload: UpdateProfilePayload): Promise<{ success: boolean; fieldErrors?: Record<string, string> }> => {
      try {
        setLocalError(null);
        await updateInfoMutation.mutateAsync(payload);
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

          if (genericError) setLocalError(genericError);
          return { success: false, fieldErrors };
        }

        const msg = errData?.message ?? "Update failed";
        setLocalError(msg);
        return { success: false };
      }
    },
    [updateInfoMutation]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      // Client-side validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setLocalError("Only image files are accepted (JPG, PNG, GIF, WEBP)");
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setLocalError("Image must not exceed 10MB");
        return false;
      }

      try {
        setAvatarUploading(true);
        setLocalError(null);

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
          setLocalError("Image upload failed because the server did not return a URL");
          return false;
        }
        if (!avatarUrl.startsWith("http") && !avatarUrl.startsWith("https")) {
          avatarUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:5512") + avatarUrl;
        }

        // Phase 2: save URL to profile
        await uploadAvatarMutation.mutateAsync(avatarUrl);
        return true;
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Image upload failed";
        setLocalError(msg);
        return false;
      } finally {
        setAvatarUploading(false);
      }
    },
    [uploadAvatarMutation]
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
        setLocalError(null);
        await changePasswordMutation.mutateAsync(payload);
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

          if (genericError) setLocalError(genericError);
          return { success: false, fieldErrors };
        }

        const msg = errData?.message ?? "Password change failed";
        setLocalError(msg);
        return { success: false, message: msg };
      }
    },
    [changePasswordMutation]
  );

  const saving = updateInfoMutation.isPending || changePasswordMutation.isPending;
  const error = localError || (queryError ? "Could not load profile information" : null);

  return {
    profile: profileData ?? null,
    loading,
    saving,
    avatarUploading,
    error,
    updateInfo,
    uploadAvatar,
    changePassword,
    refreshProfile: refetch,
  };
}
