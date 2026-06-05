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

const DISPLAY_FORMAT = "MM/dd/yyyy";
const VALUE_FORMAT = "yyyy-MM-dd";
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
  placeholder = "MM/DD/YYYY",
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

  useEffect(() => {
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
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(viewMonth)),
  });
  const today = new Date();

  const selectDate = (date: Date) => {
    onChange(toDateKey(date));
    setInputValue(format(date, DISPLAY_FORMAT));
    setViewMonth(date);
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange(null);
    setInputValue("");
    setIsOpen(false);
  };

  const commitTypedDate = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }

    const parsed = parse(trimmed, DISPLAY_FORMAT, new Date());
    if (!isValid(parsed)) {
      setInputValue(getDisplayValue(value));
      return;
    }

    onChange(toDateKey(parsed));
    setViewMonth(parsed);
    setInputValue(format(parsed, DISPLAY_FORMAT));
  };

  const themeClass =
    theme === "dark"
      ? "bg-gray-900 text-gray-100 border-gray-700"
      : theme === "light"
        ? "bg-white text-gray-900 border-gray-200"
        : "bg-white text-gray-900 border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700";
  const panelThemeClass =
    theme === "dark"
      ? "bg-gray-900 text-gray-100 border-gray-700"
      : theme === "light"
        ? "bg-white text-gray-900 border-gray-200"
        : "bg-white text-gray-900 border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700";

  const popover = isOpen && !disabled ? (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className={`rounded-xl border shadow-2xl ${panelThemeClass}`}
      role="dialog"
      aria-label="Date picker calendar"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setViewMonth((current) => subMonths(current, 1))}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold">{format(viewMonth, "MMMM yyyy")}</div>
        <button
          type="button"
          onClick={() => setViewMonth((current) => addMonths(current, 1))}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">
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
                  "grid h-9 place-items-center rounded-md text-sm font-medium transition-colors",
                  selected
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300",
                  !selected && currentMonth ? "text-gray-800 dark:text-gray-100" : "",
                  !selected && !currentMonth ? "text-gray-400 dark:text-gray-600" : "",
                  !selected && isToday ? "ring-1 ring-indigo-400" : "",
                ].join(" ")}
                aria-pressed={selected}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          type="button"
          onClick={clearDate}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          type="button"
          onClick={() => selectDate(today)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Today
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onChange={(event) => setInputValue(event.target.value)}
        onBlur={commitTypedDate}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitTypedDate();
            setIsOpen(false);
          }
        }}
        className={`h-9 w-full rounded-md border pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${themeClass} ${inputClassName}`}
      />
      {typeof document !== "undefined" ? createPortal(popover, document.body) : null}
    </div>
  );
}
