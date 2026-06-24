"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

type ThemeMode = "light" | "dark";
type PopoverPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export type CustomDatePickerProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  theme?: ThemeMode;
  className?: string;
  inputClassName?: string;
  popoverPlacement?: PopoverPlacement;
  ariaLabel?: string;
};

const DISPLAY_FORMAT = "dd/MM/yyyy";
const VALUE_FORMAT = "yyyy-MM-dd";
const WEEK_START = 1 as const; // Monday — consistent with timeline weekStartsOn
const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const toDateKey = (date: Date) => format(date, VALUE_FORMAT);

const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null;

  const raw = String(value).trim();
  const isoKey = raw.slice(0, 10);
  const parsed =
    /^\d{4}-\d{2}-\d{2}$/.test(isoKey)
      ? parse(isoKey, VALUE_FORMAT, new Date())
      : parse(raw, DISPLAY_FORMAT, new Date());

  return isValid(parsed) ? parsed : null;
};

const getDisplayValue = (value?: string | null) => {
  const parsed = parseDateValue(value);
  return parsed ? format(parsed, DISPLAY_FORMAT) : "";
};

const getPopoverStyle = (
  rect: DOMRect,
  placement: PopoverPlacement,
): React.CSSProperties => {
  const width = 320;
  const gap = 8;
  const top =
    placement.startsWith("top")
      ? Math.max(12, rect.top - 360 - gap)
      : rect.bottom + gap;
  const left =
    placement.endsWith("end")
      ? Math.max(12, rect.right - width)
      : Math.max(12, rect.left);

  return {
    position: "fixed",
    top,
    left: Math.min(left, window.innerWidth - width - 12),
    width,
    zIndex: 100000,
  };
};

export default function CustomDatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "DD/MM/YYYY",
  theme,
  className = "",
  inputClassName = "",
  popoverPlacement = "bottom-start",
  ariaLabel = "Choose date",
}: CustomDatePickerProps) {
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const [inputValue, setInputValue] = useState(getDisplayValue(value));
  const [viewMonth, setViewMonth] = useState(selectedDate ?? new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Tracks a locally-committed value not yet reflected back via the value prop.
  // Prevents stale intermediate parent renders from flickering the input.
  const pendingValueRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (pendingValueRef.current !== undefined) {
      if (value === pendingValueRef.current) pendingValueRef.current = undefined;
      else return;
    }
    setInputValue(getDisplayValue(value));
    if (selectedDate) setViewMonth(selectedDate);
  }, [selectedDate, value]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) setPopoverStyle(getPopoverStyle(rect, popoverPlacement));
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, popoverPlacement]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const monthStart = startOfMonth(viewMonth);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: WEEK_START }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: WEEK_START }),
  });
  // Phase 6: stable reference — avoids creating a new Date on every render
  const today = useMemo(() => new Date(), []);

  const selectDate = (date: Date) => {
    const key = toDateKey(date);
    pendingValueRef.current = key;
    onChange(key);
    setInputValue(format(date, DISPLAY_FORMAT));
    setViewMonth(date);
    setIsOpen(false);
  };

  const clearDate = () => {
    pendingValueRef.current = null;
    onChange(null);
    setInputValue("");
    setIsOpen(false);
  };

  const commitTypedDate = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      pendingValueRef.current = null;
      onChange(null);
      return;
    }

    const parsed = parse(trimmed, DISPLAY_FORMAT, new Date());
    if (!isValid(parsed)) {
      setInputValue(getDisplayValue(value));
      return;
    }

    const key = toDateKey(parsed);
    pendingValueRef.current = key;
    onChange(key);
    setViewMonth(parsed);
    setInputValue(format(parsed, DISPLAY_FORMAT));
  };

  const themeClass =
    theme === "dark"
      ? "bg-[#252525] text-[#E8E8E7] border-white/10"
      : theme === "light"
        ? "bg-white text-[#111111] border-[#EAEAEA]"
        : "bg-white text-[#111111] border-[#EAEAEA] dark:bg-[#252525] dark:text-[#E8E8E7] dark:border-white/10";
  const panelThemeClass =
    theme === "dark"
      ? "bg-[#252525] text-[#E8E8E7] border-white/10"
      : theme === "light"
        ? "bg-white text-[#111111] border-[#EAEAEA]"
        : "bg-white text-[#111111] border-[#EAEAEA] dark:bg-[#252525] dark:text-[#E8E8E7] dark:border-white/10";

  const popover = isOpen && !disabled ? (
    <div
      ref={popoverRef}
      style={{ ...popoverStyle, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      className={`rounded-[8px] border ${panelThemeClass}`}
      role="dialog"
      aria-label="Date picker calendar"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between border-b border-[#EAEAEA] px-4 py-3 dark:border-white/8">
        <button
          type="button"
          onClick={() => setViewMonth((current) => subMonths(current, 1))}
          className="rounded-[6px] p-1.5 text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/8 dark:hover:text-[#E8E8E7]"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-[0.8125rem] font-semibold">{format(viewMonth, "MMMM yyyy")}</div>
        <button
          type="button"
          onClick={() => setViewMonth((current) => addMonths(current, 1))}
          className="rounded-[6px] p-1.5 text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/8 dark:hover:text-[#E8E8E7]"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[0.6875rem] font-semibold uppercase text-[#ABABAB] dark:text-[#6B6B6B]">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const selected = selectedDate ? isSameDay(day, selectedDate) : false;
            const currentMonth = isSameMonth(day, viewMonth);
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => selectDate(day)}
                className={[
                  "grid h-9 place-items-center rounded-[6px] text-[0.8125rem] font-medium transition-colors",
                  selected
                    ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                    : "hover:bg-[#EFF6FF] hover:text-[#2563EB] dark:hover:bg-[rgba(37,99,235,0.12)] dark:hover:text-[#93C5FD]",
                  !selected && currentMonth ? "text-[#111111] dark:text-[#E8E8E7]" : "",
                  !selected && !currentMonth ? "text-[#ABABAB] dark:text-[#6B6B6B]" : "",
                  !selected && isToday ? "ring-1 ring-[#2563EB]" : "",
                ].join(" ")}
                aria-pressed={selected}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#EAEAEA] px-4 py-3 dark:border-white/8">
        <button
          type="button"
          onClick={clearDate}
          className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1.5 text-[0.8125rem] font-medium text-[#787774] hover:bg-[#F7F6F3] hover:text-[#9F2F2D] dark:text-[#9B9A97] dark:hover:bg-white/8 dark:hover:text-[#F87171]"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          type="button"
          onClick={() => selectDate(today)}
          className="rounded-[6px] bg-[#2563EB] px-3 py-1.5 text-[0.8125rem] font-semibold text-white hover:bg-[#1D4ED8]"
        >
          Today
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
      <input
        type="text"
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onChange={(event) => setInputValue(event.target.value)}
        onBlur={() => { commitTypedDate(); setIsOpen(false); }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitTypedDate();
            setIsOpen(false);
          }
        }}
        className={`h-9 w-full rounded-[6px] border pl-9 pr-3 text-[0.8125rem] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-60 ${themeClass} ${inputClassName}`}
      />
      {typeof document !== "undefined" ? createPortal(popover, document.body) : null}
    </div>
  );
}
