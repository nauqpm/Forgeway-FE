"use client";

import { Check } from "lucide-react";

import type { WorkspaceSampleAvatar } from "@/modules/workspace/shared/utils/workspaceAvatar";

interface WorkspaceAvatarPickerProps {
  avatars: WorkspaceSampleAvatar[];
  selectedAvatar?: string;
  isLoading?: boolean;
  onSelect: (avatarUrl: string) => void;
}

export default function WorkspaceAvatarPicker({
  avatars,
  selectedAvatar,
  isLoading = false,
  onSelect,
}: WorkspaceAvatarPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-[8px] bg-[#F7F6F3] dark:bg-[#252525]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
      {avatars.map((avatar) => {
        const selected = selectedAvatar === avatar.url;

        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelect(avatar.url)}
            className={`relative aspect-square overflow-hidden rounded-[8px] border transition-all ${
              selected
                ? "border-[#2563EB] ring-2 ring-[#2563EB]/25 dark:border-[#3B82F6]"
                : "border-[#EAEAEA] hover:border-[#2563EB]/40 dark:border-white/[0.08] dark:hover:border-[#3B82F6]/40"
            }`}
          >
            <img src={avatar.url} alt="" className="h-full w-full object-cover" />
            {selected && (
              <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white dark:bg-[#3B82F6]">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
