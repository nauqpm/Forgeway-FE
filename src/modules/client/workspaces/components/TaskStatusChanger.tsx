"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  resolveTaskStatusColumn,
  type TaskStatusColumn,
} from "../utils/taskStatusColumns";

type TaskStatusChangerIssue = {
  columnId?: string | null;
  status?: string | null;
  isArchived?: boolean;
};

type TaskStatusChangerProps = {
  issue: TaskStatusChangerIssue;
  boardColumns?: TaskStatusColumn[];
  disabled?: boolean;
  onChange?: (change: {
    columnId: string;
    status: string;
    column: TaskStatusColumn;
  }) => void;
  variant?: "default" | "pill";
  size?: "sm" | "md";
  menuAlign?: "left" | "right";
  className?: string;
};

const buttonStyles = {
  default:
    "rounded-[6px] border border-[#EAEAEA] bg-[#F7F6F3] text-[#111111] hover:bg-[#EAEAEA] dark:border-white/[0.08] dark:bg-[#2A2A2A] dark:text-[#E8E8E7] dark:hover:bg-[#333333]",
  pill:
    "rounded-full bg-[#F7F6F3] text-[#787774] hover:opacity-80 dark:bg-[#2A2A2A] dark:text-[#9B9A97]",
};

const sizeStyles = {
  sm: "gap-1 px-2 py-0.5 text-[0.6875rem]",
  md: "gap-1.5 px-3 py-1.5 text-[0.8125rem]",
};

export default function TaskStatusChanger({
  issue,
  boardColumns = [],
  disabled,
  onChange,
  variant = "default",
  size = "md",
  menuAlign = "left",
  className = "",
}: TaskStatusChangerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isDisabled = disabled || issue.isArchived || !onChange;
  const { statusColumns, currentColumn, displayName } = resolveTaskStatusColumn(
    boardColumns,
    issue,
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleChange = (column: TaskStatusColumn) => {
    setOpen(false);
    if (isDisabled) return;
    if (column.id === issue.columnId && column.name === issue.status) return;

    onChange?.({
      columnId: column.id,
      status: column.name,
      column,
    });
  };

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex ${className}`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => {
          if (!isDisabled) setOpen((current) => !current);
        }}
        disabled={isDisabled}
        className={`inline-flex items-center font-semibold transition-colors ${buttonStyles[variant]} ${sizeStyles[size]} ${
          isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        }`}
      >
        <span className="max-w-36 truncate">{displayName}</span>
        {!isDisabled && (
          <ChevronDown
            className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
          />
        )}
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-1 min-w-40 overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white py-1 dark:border-white/[0.06] dark:bg-[#202020] ${
            menuAlign === "right" ? "right-0" : "left-0"
          }`}
          style={{
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {statusColumns.map((column) => {
            const selected = column.id === currentColumn?.id;

            return (
              <button
                key={column.id}
                type="button"
                onClick={() => handleChange(column)}
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
                <span className="truncate">{column.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
