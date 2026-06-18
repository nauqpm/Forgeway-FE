"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_DOT: Record<string, string> = {
  Highest: "bg-[#7F1D1D]",
  High:    "bg-[#9F2F2D]",
  Medium:  "bg-[#956400]",
  Low:     "bg-[#1F6C9F]",
  Lowest:  "bg-[#346538]",
};

export const PRIORITY_PILL: Record<string, string> = {
  Highest: "bg-[#FDEBEC] text-[#7F1D1D] dark:bg-[rgba(127,29,29,0.18)] dark:text-[#FCA5A5]",
  High:    "bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[rgba(159,47,45,0.12)] dark:text-[#F87171]",
  Medium:  "bg-[#FBF3DB] text-[#956400] dark:bg-[rgba(149,100,0,0.12)] dark:text-[#F59E0B]",
  Low:     "bg-[#EFF6FF] text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]",
  Lowest:  "bg-[#EAF6EF] text-[#346538] dark:bg-[rgba(52,101,56,0.12)] dark:text-[#86EFAC]",
};

export interface PriorityPickerProps {
  value?: string | null;
  onChange?: (priority: string) => void;
  /** Direction the dropdown opens. Defaults to "bottom". */
  placement?: "bottom" | "top";
  size?: "sm" | "md";
  disabled?: boolean;
  /**
   * pill    — colored rounded badge; good for board rows, list cells, backlog rows
   * default — ghost button with border; good for BulkActionBar and detail sidebars
   */
  variant?: "pill" | "default";
  className?: string;
  fullWidth?: boolean;
}

export default function PriorityPicker({
  value,
  onChange,
  placement = "bottom",
  size = "md",
  disabled,
  variant = "pill",
  className = "",
  fullWidth = false,
}: PriorityPickerProps) {
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
      const dropdownH = 220;
      const useTop = placement === "top" || (spaceBelow < dropdownH && rect.top > dropdownH);
      if (useTop) {
        setDropdownStyle({ top: rect.top - dropdownH - 4, left: rect.left });
      } else {
        setDropdownStyle({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setOpen((p) => !p);
  };

  const label = value ?? "Priority";
  const dotColor = value ? (PRIORITY_DOT[value] ?? "bg-[#ABABAB]") : "bg-[#ABABAB] dark:bg-[#6B6B6B]";

  const triggerCls =
    variant === "pill"
      ? [
          "inline-flex items-center gap-1 rounded-full font-semibold transition-opacity",
          size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-xs",
          value
            ? `${PRIORITY_PILL[value] ?? PRIORITY_PILL.Medium} ${!isDisabled ? "hover:opacity-80 cursor-pointer" : ""}`
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
          {PRIORITIES.map((p) => {
            const isSelected = p === value;
            return (
              <button
                key={p}
                type="button"
                onClick={() => { onChange?.(p); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-[0.8125rem] text-left transition-colors ${
                  isSelected
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] font-semibold text-[#2563EB] dark:text-[#3B82F6]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[p]}`} />
                <span className="flex-1">{p}</span>
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
        <span className={`truncate${fullWidth ? " flex-1" : ""}`}>{label}</span>
        {!isDisabled && (
          <ChevronDown className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
        )}
      </button>

      {dropdown}
    </div>
  );
}
