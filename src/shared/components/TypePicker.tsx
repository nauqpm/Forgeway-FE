"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, FileText, Bug, Zap, BookOpen, ChevronDown } from "lucide-react";

export const TASK_TYPES = ["Task", "Bug", "Epic", "Story"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

type IconComp = React.ComponentType<{ className?: string }>;

export const TASK_TYPE_CONFIG: Record<string, {
  Icon: IconComp;
  iconColor: string;
  pillBg: string;
  pillText: string;
  dotColor: string;
}> = {
  Task: {
    Icon: FileText,
    iconColor: "text-[#2563EB] dark:text-[#60A5FA]",
    pillBg: "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]",
    pillText: "text-[#1F6C9F] dark:text-[#93C5FD]",
    dotColor: "bg-[#2563EB]",
  },
  Bug: {
    Icon: Bug,
    iconColor: "text-[#9F2F2D] dark:text-[#F87171]",
    pillBg: "bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)]",
    pillText: "text-[#9F2F2D] dark:text-[#F87171]",
    dotColor: "bg-[#9F2F2D]",
  },
  Epic: {
    Icon: Zap,
    iconColor: "text-[#7C3AED] dark:text-[#A78BFA]",
    pillBg: "bg-[#F3EFFE] dark:bg-[rgba(124,58,237,0.12)]",
    pillText: "text-[#6D28D9] dark:text-[#A78BFA]",
    dotColor: "bg-[#7C3AED]",
  },
  Story: {
    Icon: BookOpen,
    iconColor: "text-[#346538] dark:text-[#6FCF7B]",
    pillBg: "bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)]",
    pillText: "text-[#346538] dark:text-[#6FCF7B]",
    dotColor: "bg-[#346538]",
  },
};

export interface TypePickerProps {
  value?: string | null;
  onChange?: (type: string) => void;
  placement?: "bottom" | "top";
  size?: "sm" | "md";
  disabled?: boolean;
  variant?: "pill" | "default";
  className?: string;
  fullWidth?: boolean;
}

export default function TypePicker({
  value,
  onChange,
  placement = "bottom",
  size = "md",
  disabled,
  variant = "pill",
  className = "",
  fullWidth = false,
}: TypePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isDisabled = disabled || !onChange;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    const closeOnScroll = () => setOpen(false);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const handleOpen = () => {
    if (isDisabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownH = 180;
      const useTop = placement === "top" || (spaceBelow < dropdownH && rect.top > dropdownH);
      if (useTop) {
        setDropdownStyle({ top: rect.top - dropdownH - 4, left: rect.left });
      } else {
        setDropdownStyle({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setOpen((p) => !p);
  };

  const resolved = TASK_TYPES.find((t) => t.toLowerCase() === (value ?? "").toLowerCase()) ?? "Task";
  const cfg = TASK_TYPE_CONFIG[resolved];
  const label = resolved;
  const Icon = cfg?.Icon ?? FileText;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _iconColor = cfg?.iconColor ?? "text-[#ABABAB]";
  const dotColor = cfg?.dotColor ?? "bg-[#ABABAB]";

  const triggerCls =
    variant === "pill"
      ? [
          "inline-flex items-center gap-1 rounded-full font-semibold transition-opacity",
          size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-xs",
          cfg
            ? `${cfg.pillBg} ${cfg.pillText} ${!isDisabled ? "hover:opacity-80 cursor-pointer" : ""}`
            : `bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#787774] dark:text-[#9B9A97] ${!isDisabled ? "hover:bg-[#EAEAEA] dark:hover:bg-[#333333] cursor-pointer" : ""}`,
          isDisabled ? "cursor-not-allowed opacity-70" : "",
        ].join(" ")
      : [
          "inline-flex items-center gap-1.5 rounded-[6px] border font-medium transition-colors text-left",
          size === "sm" ? "h-7 px-2.5 text-sm" : "h-8 px-3 text-sm",
          "border-[#EAEAEA] dark:border-white/[0.08] bg-transparent",
          "text-[#787774] dark:text-[#9B9A97]",
          fullWidth ? "w-full" : "",
          !isDisabled
            ? "hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] hover:border-[#D0D0D0] dark:hover:border-white/[0.18] hover:text-[#111111] dark:hover:text-[#E8E8E7] cursor-pointer"
            : "cursor-not-allowed opacity-70",
        ].join(" ");

  const dropdown = open && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed z-[999999] min-w-[9rem] overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1"
          style={{ ...dropdownStyle, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {TASK_TYPES.map((t) => {
            const c = TASK_TYPE_CONFIG[t];
            const TypeIcon = c.Icon;
            const isSelected = t === resolved;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { onChange?.(t); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-[0.8125rem] text-left transition-colors ${
                  isSelected
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] font-semibold text-[#2563EB] dark:text-[#3B82F6]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                }`}
              >
                <TypeIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#2563EB] dark:text-[#3B82F6]" : c.iconColor}`} />
                <span className="flex-1">{t}</span>
                {isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={rootRef}
      className={`relative ${fullWidth ? "flex w-full" : "inline-flex"} ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        onClick={handleOpen}
        className={triggerCls}
      >
        {variant === "default" && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        )}
        {variant === "pill" && cfg && (
          <Icon className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} shrink-0 ${cfg.pillText}`} />
        )}
        <span className={`truncate${fullWidth ? " flex-1" : ""}`}>{label}</span>
        {!isDisabled && (
          <ChevronDown className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
        )}
      </button>

      {dropdown}
    </div>
  );
}
