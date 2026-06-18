"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type StatusOption = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type StatusPickerProps = {
  value?: string | null;
  columnId?: string | null;
  options?: StatusOption[] | string[];
  disabled?: boolean;
  onChange?: (value: string, option: StatusOption) => void;
  variant?: "default" | "pill" | "input";
  size?: "sm" | "md";
  menuAlign?: "left" | "right";
  /** Which direction the dropdown opens. Defaults to "bottom". Use "top" when inside a fixed bottom bar. */
  placement?: "bottom" | "top";
  /** Label shown when no value is selected (overrides "No status" default). */
  placeholder?: string;
  className?: string;
};

const buttonStyles = {
  default:
    "rounded-[6px] border border-[#EAEAEA] bg-[#F7F6F3] text-[#111111] hover:bg-[#EAEAEA] dark:border-white/[0.08] dark:bg-[#2A2A2A] dark:text-[#E8E8E7] dark:hover:bg-[#333333]",
  pill:
    "rounded-full bg-[#F7F6F3] text-[#787774] hover:opacity-80 dark:bg-[#2A2A2A] dark:text-[#9B9A97]",
  input:
    "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[0.8125rem] outline-none transition-colors justify-between",
};

const sizeStyles = {
  sm: "gap-1 px-2 py-0.5 text-[0.6875rem]",
  md: "gap-1.5 px-3 py-1.5 text-[0.8125rem]",
};

export default function StatusPicker({
  value,
  columnId,
  options = [],
  disabled,
  onChange,
  variant = "default",
  size = "md",
  menuAlign = "left",
  placement = "bottom",
  placeholder,
  className = "",
}: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isDisabled = disabled || !onChange;

  // Normalize options
  const normalizedOptions: StatusOption[] = options.map((opt) =>
    typeof opt === "string" ? { id: opt, name: opt } : opt
  );

  // Default fallback if no options provided
  const fallbackOptions: StatusOption[] = [
    { id: "todo", name: "To Do" },
    { id: "inprogress", name: "In Progress" },
    { id: "review", name: "Review" },
    { id: "done", name: "Done" },
  ];

  const finalOptions = normalizedOptions.length > 0 ? normalizedOptions : fallbackOptions;

  // Resolve current selection
  const currentOption = finalOptions.find(
    (opt) =>
      (columnId && opt.id === columnId) ||
      (value && opt.name === value) ||
      (value && opt.id === value) ||
      (value && opt.name.toLowerCase() === value.toLowerCase())
  );

  const displayName = currentOption?.name ?? placeholder ?? value ?? columnId ?? "No status";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    const closeOnScroll = () => setOpen(false);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const handleOpen = () => {
    if (isDisabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownH = Math.min(finalOptions.length * 40 + 8, 260);
      const spaceBelow = window.innerHeight - rect.bottom;
      const useTop = placement === "top" || (spaceBelow < dropdownH && rect.top > dropdownH);
      const leftPos = menuAlign === "right" ? rect.right - 160 : rect.left;
      if (useTop) {
        setDropdownStyle({ top: rect.top - dropdownH - 4, left: leftPos });
      } else {
        setDropdownStyle({ top: rect.bottom + 4, left: leftPos });
      }
    }
    setOpen((current) => !current);
  };

  const handleChange = (option: StatusOption) => {
    setOpen(false);
    if (isDisabled) return;
    if (option.id === currentOption?.id) return;
    onChange?.(option.name, option);
  };

  const dropdown = open && variant !== "input" && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed z-[999999] min-w-40 overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white py-1 dark:border-white/[0.06] dark:bg-[#202020]"
          style={{ ...dropdownStyle, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {finalOptions.map((option) => {
            const selected = option.id === currentOption?.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChange(option)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors ${
                  selected
                    ? "border-l-2 border-[#2563EB] bg-[#EFF6FF] font-medium text-[#2563EB] dark:border-[#3B82F6] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#3B82F6]"
                    : "text-[#787774] hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-[#2E2E2E]"
                }`}
              >
                {selected ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{option.name}</span>
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
      className={`relative ${variant === "input" ? "block w-full" : "inline-flex"} ${className}`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={variant === "input" ? () => { if (!isDisabled) setOpen((c) => !c); } : handleOpen}
        disabled={isDisabled}
        className={`inline-flex items-center font-semibold transition-colors ${buttonStyles[variant]} ${variant !== "input" ? sizeStyles[size] : ""} ${
          isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        }`}
      >
        <span className="max-w-36 truncate">{displayName}</span>
        {!isDisabled && (
          <ChevronDown className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        )}
      </button>

      {variant === "input" && open && (
        <div
          className={`absolute z-50 w-full left-0 overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white py-1 dark:border-white/[0.06] dark:bg-[#202020] ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {finalOptions.map((option) => {
            const selected = option.id === currentOption?.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChange(option)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors ${
                  selected
                    ? "border-l-2 border-[#2563EB] bg-[#EFF6FF] font-medium text-[#2563EB] dark:border-[#3B82F6] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#3B82F6]"
                    : "text-[#787774] hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-[#2E2E2E]"
                }`}
              >
                {selected ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{option.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {dropdown}
    </div>
  );
}
