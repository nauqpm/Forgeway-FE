"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import CustomDatePicker from "@/shared/components/CustomDatePicker";
import type {
  AppUserProfile,
  UpdateProfilePayload,
} from "../types/profile.types";

interface Props {
  profile: AppUserProfile;
  saving: boolean;
  avatarUploading: boolean;
  onUpdateInfo: (
    payload: UpdateProfilePayload,
  ) => Promise<{ success: boolean; fieldErrors?: Record<string, string> }>;
  onUploadAvatar: (file: File) => Promise<boolean>;
}

const labelCls = "block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5";
const inputBaseCls = "w-full px-3 py-2 border rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:outline-none transition-colors";
const inputNormalCls = `${inputBaseCls} border-[#EAEAEA] dark:border-white/10 focus:border-[#2563EB] dark:focus:border-[#3B82F6]`;
const inputErrorCls = `${inputBaseCls} border-[#9F2F2D] focus:border-[#9F2F2D]`;

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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBirthdayChange = (value: string | null) => {
    setFieldErrors((prev) => ({ ...prev, birthday: "" }));
    setForm((prev) => ({ ...prev, birthday: value ?? "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};
    let hasClientError = false;

    if (form.phone && !/^(\+?[1-9]\d{7,14}|0\d{9,10})$/.test(form.phone)) {
      newFieldErrors.phone = "Invalid phone number";
      hasClientError = true;
    }

    if (form.birthday) {
      const bdate = new Date(form.birthday);
      if (isNaN(bdate.getTime())) {
        newFieldErrors.birthday = "Invalid date of birth";
        hasClientError = true;
      } else if (bdate > new Date()) {
        newFieldErrors.birthday = "Date of birth cannot be in the future";
        hasClientError = true;
      }
    }

    if (
      form.fullName &&
      (form.fullName.length < 2 || form.fullName.length > 100)
    ) {
      newFieldErrors.fullName = "Full name must be between 2 and 100 characters";
      hasClientError = true;
    }

    if (hasClientError) {
      setFieldErrors(newFieldErrors);
      return;
    }

    const res = await onUpdateInfo({
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      birthday: form.birthday,
      gender: form.gender as "male" | "female" | "other",
    });
    if (res.success) {
      toast.success("Profile updated successfully");
      await verifyToken();
    } else {
      if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
      }
      toast.error("Update failed");
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
      toast.success("Avatar updated successfully");
      await verifyToken();
    } else {
      toast.error("Avatar update failed");
    }
  };

  const initials =
    (profile.fullName ?? profile.email)?.charAt(0).toUpperCase() ?? "U";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.15)] flex items-center justify-center">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.fullName ?? "Avatar"}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6]">
                {initials}
              </span>
            )}
          </div>

          {avatarUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}

          <button
            type="button"
            disabled={avatarUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Change avatar"
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
          <p className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
            {profile.fullName ?? "Not updated"}
          </p>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            {profile.email}
          </p>
          <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] mt-0.5">
            JPG, PNG, GIF, WEBP - max 10MB
          </p>
          {fieldErrors.avatar && (
            <p className="text-[0.8125rem] text-[#9F2F2D] mt-1">
              {fieldErrors.avatar}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Full name</label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Enter full name"
            className={fieldErrors.fullName ? inputErrorCls : inputNormalCls}
          />
          {fieldErrors.fullName && (
            <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D]">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] bg-[#F9F9F8] dark:bg-[#252525] text-[#ABABAB] dark:text-[#6B6B6B] cursor-not-allowed"
          />
          <p className="mt-1 text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className={labelCls}>Phone number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            className={fieldErrors.phone ? inputErrorCls : inputNormalCls}
          />
          {fieldErrors.phone && (
            <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D]">
              {fieldErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>Date of birth</label>
          <CustomDatePicker
            value={form.birthday}
            onChange={handleBirthdayChange}
            placeholder="DD/MM/YYYY"
            inputClassName={`h-9 rounded-[6px] ${
              fieldErrors.birthday
                ? "border-[#9F2F2D] focus:border-[#9F2F2D]"
                : "border-[#EAEAEA] dark:border-white/10 focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
            } bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7]`}
            ariaLabel="Date of birth"
          />
          {fieldErrors.birthday && (
            <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D]">
              {fieldErrors.birthday}
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className={fieldErrors.gender ? inputErrorCls : inputNormalCls}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {fieldErrors.gender && (
            <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D]">
              {fieldErrors.gender}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter address"
            className={fieldErrors.address ? inputErrorCls : inputNormalCls}
          />
          {fieldErrors.address && (
            <p className="mt-1.5 text-[0.8125rem] text-[#9F2F2D]">
              {fieldErrors.address}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-[6px] text-[0.8125rem] font-medium transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
