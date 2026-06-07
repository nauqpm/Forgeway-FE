"use client";

import { HTMLAttributes } from "react";

// ── Status variants ──────────────────────────────────────────────────────────
type StatusVariant =
  | "todo"
  | "inprogress"
  | "done"
  | "cancelled"
  | "blocked";

// ── Priority variants ────────────────────────────────────────────────────────
type PriorityVariant = "urgent" | "high" | "medium" | "low";

type BadgeVariant = StatusVariant | PriorityVariant | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  // status
  todo:        { bg: "var(--status-todo-bg)",        text: "var(--status-todo-text)" },
  inprogress:  { bg: "var(--status-inprogress-bg)",  text: "var(--status-inprogress-text)" },
  done:        { bg: "var(--status-done-bg)",         text: "var(--status-done-text)" },
  cancelled:   { bg: "var(--status-cancelled-bg)",   text: "var(--status-cancelled-text)" },
  blocked:     { bg: "var(--status-blocked-bg)",      text: "var(--status-blocked-text)" },
  // priority
  urgent:      { bg: "var(--priority-urgent-bg)",    text: "var(--priority-urgent-text)" },
  high:        { bg: "var(--priority-high-bg)",       text: "var(--priority-high-text)" },
  medium:      { bg: "var(--priority-medium-bg)",    text: "var(--priority-medium-text)" },
  low:         { bg: "var(--priority-low-bg)",        text: "var(--priority-low-text)" },
  // neutral
  default:     { bg: "#F7F6F3",                       text: "#787774" },
};

function Badge({
  variant = "default",
  dot = false,
  className = "",
  children,
  style,
  ...props
}: BadgeProps) {
  const { bg, text } = variantStyles[variant];

  return (
    <span
      className={[
        "inline-flex items-center gap-1",
        "px-1.5 py-0.5",
        "text-[11px] font-medium tracking-wide uppercase",
        "rounded-[4px] whitespace-nowrap",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: bg, color: text, ...style }}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: text }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// ── Label map for convenience ────────────────────────────────────────────────
const STATUS_LABELS: Record<StatusVariant, string> = {
  todo:       "To Do",
  inprogress: "In Progress",
  done:       "Done",
  cancelled:  "Cancelled",
  blocked:    "Blocked",
};

const PRIORITY_LABELS: Record<PriorityVariant, string> = {
  urgent: "Urgent",
  high:   "High",
  medium: "Medium",
  low:    "Low",
};

export { Badge, STATUS_LABELS, PRIORITY_LABELS };
export type { BadgeVariant, StatusVariant, PriorityVariant, BadgeProps };
