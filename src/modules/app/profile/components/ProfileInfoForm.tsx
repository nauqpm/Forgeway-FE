"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import type { AppUserProfile, UpdateProfilePayload } from "../types/profile.types";

interface Props {
  profile: AppUserProfile;
  saving: boolean;
  avatarUploading: boolean;
  onUpdateInfo: (payload: UpdateProfilePayload) => Promise<boolean>;
  onUploadAvatar: (file: File) => Promise<boolean>;
}

export function ProfileInfoForm({
  profile,
  saving,
  avatarUploading,
  onUpdateInfo,
  onUploadAvatar,
}: Props) {
  const { verifyToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: profile.fullName ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    birthday: profile.birthday ?? "",
    gender: profile.gender ?? "other",
  });

  useEffect(() => {
    setForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      birthday: profile.birthday ?? "",
      gender: profile.gender ?? "other",
    });
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onUpdateInfo({
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      birthday: form.birthday,
      gender: form.gender as "male" | "female" | "other",
    });
    if (ok) {
      toast.success("Cập nhật hồ sơ thành công");
      await verifyToken();
    } else {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const ok = await onUploadAvatar(file);
    if (ok) {
      toast.success("Cập nhật ảnh đại diện thành công");
      await verifyToken();
    } else {
      toast.error("Cập nhật ảnh đại diện thất bại");
    }
  };

  const initials =
    (profile.fullName ?? profile.email)?.charAt(0).toUpperCase() ?? "U";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.fullName ?? "Avatar"}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                {initials}
              </span>
            )}
          </div>

          {/* Upload overlay */}
          {avatarUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}

          {/* Camera button */}
          <button
            type="button"
            disabled={avatarUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            aria-label="Thay ảnh đại diện"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
        </div>

        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {profile.fullName ?? "Chưa cập nhật"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile.email}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            JPG, PNG, GIF, WEBP · tối đa 10MB
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Họ và tên
          </label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Email không thể thay đổi
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Ngày sinh
          </label>
          <input
            type="date"
            name="birthday"
            value={form.birthday}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Giới tính
          </label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Địa chỉ
          </label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Nhập địa chỉ"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
