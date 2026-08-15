import { LucideIcon } from "lucide-react";
import React, { useState } from "react";

type RecentItemProps = {
  icon: LucideIcon;
  title: string;
  meta: string;
  tone?: "red" | "gray";
  onClick?: () => void;
  active?: boolean;
  avatarUrl?: string;
  isUser?: boolean;
};

const cleanMeta = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*[·•]\s*$/u, "")
    .trim();

const AVATAR_COLORS = [
  "#7C3AED",
  "#6366F1",
  "#2563EB",
  "#0891B2",
  "#0D9488",
  "#16A34A",
  "#D97706",
  "#DC2626",
  "#DB2777",
  "#9333EA",
];

function getAvatarBgColor(text?: string): string {
  if (!text) return "#7C3AED";
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function RecentItem({
  icon: Icon,
  title,
  meta,
  tone = "gray",
  onClick,
  active = false,
  avatarUrl,
  isUser = false,
}: RecentItemProps) {
  const displayMeta = cleanMeta(meta);
  const [imgError, setImgError] = useState(false);
  const initial = title?.trim()?.charAt(0)?.toUpperCase() || "U";
  const showImg = Boolean(avatarUrl) && !imgError;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-[6px] px-2 py-2 text-left transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] ${active ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]" : ""}`}
    >
      {isUser ? (
        <span
          style={!showImg ? { backgroundColor: getAvatarBgColor(title) } : undefined}
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[0.8125rem] font-semibold text-white shadow-sm"
        >
          {showImg ? (
            <img
              src={avatarUrl}
              alt={title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{initial}</span>
          )}
        </span>
      ) : (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] ${
            tone === "red"
              ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
              : "bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">{title}</span>
        {displayMeta && <span className="block truncate text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">{displayMeta}</span>}
      </span>
    </button>
  );
}
