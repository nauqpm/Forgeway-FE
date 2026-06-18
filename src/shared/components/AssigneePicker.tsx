"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { User, X, Check } from "lucide-react";

/** Clean user shape — already resolved from raw workspace member */
export type AssigneePickerUser = {
  id: string;
  name: string;
  initials?: string;
  avatar?: string;
  email?: string;
};

/** Raw workspace member shape from API — used by DataGridListView */
export type AssigneePickerMember = {
  userId:
    | string
    | {
        _id?: string;
        id?: string;
        fullName?: string;
        name?: string;
        email?: string;
        avatar?: string;
        avatarUrl?: string;
      };
  role: string;
};

export function getMemberId(m: AssigneePickerMember): string {
  return typeof m.userId === "string"
    ? m.userId
    : (m.userId?._id ?? m.userId?.id ?? "");
}

export function getMemberDisplayName(m: AssigneePickerMember): string {
  if (typeof m.userId === "string") return m.userId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = m.userId as any;
  return u?.fullName || u?.name || u?.email || "Unknown";
}

export function resolveMemberName(
  members: AssigneePickerMember[] | undefined,
  assigneeId: string | undefined
): string | null {
  if (!assigneeId || assigneeId === "U" || !members) return null;
  for (const m of members) {
    if (getMemberId(m) === assigneeId) return getMemberDisplayName(m);
  }
  return null;
}

/** Convert raw API members to AssigneePickerUser for DataGridListView */
export function toAssigneePickerUsers(
  members: AssigneePickerMember[] | undefined
): AssigneePickerUser[] {
  if (!members) return [];
  return members
    .map((m) => {
      const id = getMemberId(m);
      const name = getMemberDisplayName(m);
      const avatar =
        typeof m.userId === "object"
          ? m.userId?.avatar || m.userId?.avatarUrl
          : undefined;
      const email = typeof m.userId === "object" ? m.userId?.email : undefined;
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.substring(0, 2).toUpperCase();
      return { id, name, initials, avatar, email };
    })
    .filter((u) => u.id);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const MENU_MAX_H = 244;
const MENU_MIN_W = 190;

interface AssigneePickerProps {
  users: AssigneePickerUser[];
  value: string | null | undefined;
  onChange: (userId: string | null) => void;
  placement?: "bottom" | "top" | "auto";
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function AssigneePicker({
  users,
  value,
  onChange,
  placement = "auto",
  size = "md",
  disabled = false,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp =
        placement === "top" ||
        (placement === "auto" && spaceBelow < MENU_MAX_H && spaceAbove > spaceBelow);

      const rawLeft = size === "sm" ? rect.right - MENU_MIN_W : rect.left;
      const left = Math.max(8, Math.min(rawLeft, window.innerWidth - MENU_MIN_W - 8));

      // When opening upward, anchor the dropdown's bottom edge just above the trigger
      // (not top, which would leave a gap equal to MENU_MAX_H minus actual content height)
      const style: React.CSSProperties = shouldOpenUp
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left, minWidth: MENU_MIN_W, zIndex: 999999 }
        : { position: "fixed", top: rect.bottom + 4, left, minWidth: MENU_MIN_W, zIndex: 999999 };

      setMenuStyle(style);
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const user = users.find((u) => u.id === value);
  const displayName = user?.name ?? null;
  const initials = user ? (user.initials ?? getInitials(user.name)) : null;
  const avatar = user?.avatar;

  const avatarSm = size === "sm";
  const avatarSize = avatarSm ? "w-5 h-5" : "w-6 h-6";
  const iconSize = avatarSm ? "w-2.5 h-2.5" : "w-3 h-3";
  const textSize = avatarSm ? "text-[0.5625rem]" : "text-[0.625rem]";

  const dropdown = open ? (
    <div
      ref={menuRef}
      data-assignee-picker-menu="true"
      style={{ ...menuStyle, boxShadow: "0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.06)" }}
      className="max-h-52 overflow-y-auto bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.08] rounded-[8px]"
    >
      <div className="px-3 py-2 text-[0.6875rem] font-semibold text-[#787774] dark:text-[#9B9A97] border-b border-[#EAEAEA] dark:border-white/[0.08] uppercase tracking-wide">
        Assign to
      </div>
      <button
        onClick={() => { onChange(null); setOpen(false); }}
        className={`w-full text-left px-3 py-2 text-[0.8125rem] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] flex items-center gap-2 transition-colors ${
          !value
            ? "text-[#2563EB] dark:text-[#3B82F6] font-semibold"
            : "text-[#787774] dark:text-[#9B9A97]"
        }`}
      >
        <div className="w-5 h-5 rounded-full border-2 border-dashed border-[#EAEAEA] dark:border-white/[0.15] flex items-center justify-center shrink-0">
          <X className="w-2.5 h-2.5" />
        </div>
        Unassigned
        {!value && <Check className="w-3.5 h-3.5 ml-auto text-[#2563EB] dark:text-[#3B82F6] shrink-0" />}
      </button>

      {users.map((u) => {
        const ini = u.initials ?? getInitials(u.name);
        const isSelected = u.id === value;
        return (
          <button
            key={u.id}
            onClick={() => { onChange(u.id); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-[0.8125rem] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] flex items-center gap-2 transition-colors ${
              isSelected
                ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD]"
                : "text-[#111111] dark:text-[#E8E8E7]"
            }`}
          >
            <div className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[0.5625rem] font-bold shrink-0 ${u.avatar ? "" : "bg-[#2563EB] text-white"}`}>
              {u.avatar ? (
                <img src={u.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                ini
              )}
            </div>
            <span className="truncate">{u.name}</span>
            {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-[#2563EB] dark:text-[#3B82F6] shrink-0" />}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className={`relative${!avatarSm ? " w-full" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openMenu}
        className={`flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] transition-colors disabled:pointer-events-none disabled:opacity-50${!avatarSm ? " w-full" : " max-w-full"}`}
        title={displayName ?? "Unassigned"}
      >
        {displayName ? (
          <div className={`${avatarSize} rounded-full overflow-hidden flex items-center justify-center ${textSize} font-bold shrink-0 ${avatar ? "" : "bg-[#2563EB] text-white"}`}>
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
        ) : (
          <div
            className={`${avatarSize} rounded-full border-2 border-dashed border-[#EAEAEA] dark:border-white/[0.15] flex items-center justify-center shrink-0`}
          >
            <User className={`${iconSize} text-[#ABABAB] dark:text-[#6B6B6B]`} />
          </div>
        )}
        {!avatarSm && (
          <span
            className={`text-[0.8125rem] truncate ${
              displayName
                ? "text-[#111111] dark:text-[#E8E8E7]"
                : "text-[#ABABAB] dark:text-[#6B6B6B] italic"
            }`}
          >
            {displayName ?? "Unassigned"}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
