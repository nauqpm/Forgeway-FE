"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown, User, X, Check } from "lucide-react";

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
  const u = m.userId as any;
  return u?.fullName ?? u?.name ?? u?.email ?? "Unknown";
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
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.substring(0, 2).toUpperCase();
      return { id, name, initials };
    })
    .filter((u) => u.id);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

interface AssigneePickerProps {
  users: AssigneePickerUser[];
  value: string | null | undefined;
  onChange: (userId: string | null) => void;
  placement?: "bottom" | "top";
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function AssigneePicker({
  users,
  value,
  onChange,
  placement = "bottom",
  size = "md",
  disabled = false,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
  const textSize = avatarSm ? "text-[9px]" : "text-[10px]";

  const dropdownPos = placement === "top" ? "bottom-full mb-1" : "top-full mt-1";
  const dropdownAlign = avatarSm ? "right-0" : "left-0";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors max-w-full disabled:pointer-events-none disabled:opacity-50"
        title={displayName ?? "Unassigned"}
      >
        {displayName ? (
          <div
            className={`${avatarSize} rounded-full bg-indigo-500 text-white flex items-center justify-center ${textSize} font-bold shrink-0 overflow-hidden`}
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
        ) : (
          <div
            className={`${avatarSize} rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0`}
          >
            <User className={`${iconSize} text-gray-400`} />
          </div>
        )}
        {!avatarSm && (
          <>
            <span
              className={`text-sm truncate ${
                displayName
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-gray-400 dark:text-gray-500 italic"
              }`}
            >
              {displayName ?? "Unassigned"}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${dropdownAlign} ${dropdownPos} z-50 min-w-[180px] max-h-52 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl`}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 uppercase tracking-wide">
            Assign to
          </div>
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${
              !value
                ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0">
              <X className="w-2.5 h-2.5" />
            </div>
            Unassigned
            {!value && <Check className="w-3.5 h-3.5 ml-auto text-indigo-500 shrink-0" />}
          </button>

          {users.map((u) => {
            const ini = u.initials ?? getInitials(u.name);
            const isSelected = u.id === value;
            return (
              <button
                key={u.id}
                onClick={() => { onChange(u.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    ini
                  )}
                </div>
                <span className="truncate">{u.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-indigo-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
