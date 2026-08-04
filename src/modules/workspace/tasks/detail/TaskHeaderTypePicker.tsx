"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { TASK_TYPE_CONFIG } from "@/shared/components/TypePicker";

interface TaskHeaderTypePickerProps {
  type?: string;
  isSubtask: boolean;
  disabled?: boolean;
  onUpdateType?: (newType: string) => void;
}

export default function TaskHeaderTypePicker({
  type,
  isSubtask,
  disabled,
  onUpdateType,
}: TaskHeaderTypePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

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
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((p) => !p);
  };

  const resolvedValue = isSubtask ? "Subtask" : type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : "Task";
  const cfg = TASK_TYPE_CONFIG[resolvedValue] || TASK_TYPE_CONFIG["Task"];
  const Icon = cfg.Icon;
  const isTypeSubtask = isSubtask || resolvedValue === "Subtask";

  // Jira-like Hierarchy Levels
  // Level 1: Epic
  // Level 0: Task, Story, Bug
  // Level -1: Subtask
  let dropdownOptions: string[] = [];
  if (resolvedValue === "Epic") {
    dropdownOptions = ["Epic"];
  } else if (isTypeSubtask) {
    dropdownOptions = ["Subtask"];
  } else {
    dropdownOptions = ["Task", "Story", "Bug"];
  }

  const handleSelect = (selectedType: string) => {
    setOpen(false);
    if (selectedType === resolvedValue) return;
    onUpdateType?.(selectedType);
  };

  const dropdown = open && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed z-[100000] min-w-[12rem] overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1 shadow-lg"
          style={dropdownStyle}
        >
          <div className="px-3 py-1.5 text-[0.6875rem] font-semibold text-[#ABABAB] uppercase tracking-wider">
            Change work type
          </div>
          {dropdownOptions.map((t) => {
            const c = TASK_TYPE_CONFIG[t] || TASK_TYPE_CONFIG["Task"];
            const TypeIcon = c.Icon;
            const isSelected = t === resolvedValue;
            
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelect(t)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-[0.8125rem] text-left transition-colors ${
                  isSelected
                    ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] font-semibold text-[#2563EB] dark:text-[#3B82F6]"
                    : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                }`}
              >
                <div className={`w-5 h-5 rounded-[4px] flex items-center justify-center shrink-0 ${c.dotColor}`}>
                   <TypeIcon className="w-3 h-3 text-white" />
                </div>
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
    <div ref={rootRef} className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-opacity ${cfg.dotColor} ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-80"}`}
      >
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      {dropdown}
    </div>
  );
}
