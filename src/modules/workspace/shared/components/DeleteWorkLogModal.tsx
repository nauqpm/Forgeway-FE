"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback receives adjustTimeRemaining flag and the new timeEstimated in numeric hours */
  onConfirm: (adjustTimeRemaining: boolean, newTimeEstimatedHours: number) => void;
  /** Current time remaining on the task, in numeric hours */
  initialTimeRemainingHours: number;
  /** Hours of the work log being deleted, in numeric hours */
  deletedHours: number;
}

/** Format numeric hours to display string, e.g. 1.5 → "1h 30m" */
const formatHours = (hours: number): string => {
  if (hours <= 0) return "0h";
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export default function DeleteWorkLogModal({
  isOpen,
  onClose,
  onConfirm,
  initialTimeRemainingHours,
  deletedHours,
}: DeleteWorkLogModalProps) {
  const [adjustTimeRemaining, setAdjustTimeRemaining] = useState(true);

  // Default new time remaining = current remaining + deleted hours (as per stated behaviour)
  const [newTimeEstimatedHours, setNewTimeEstimatedHours] = useState(
    initialTimeRemainingHours + deletedHours
  );
  const [inputValue, setInputValue] = useState(
    formatHours(initialTimeRemainingHours + deletedHours)
  );

  React.useEffect(() => {
    if (isOpen) {
      const defaultHours = initialTimeRemainingHours + deletedHours;
      setNewTimeEstimatedHours(defaultHours);
      setInputValue(formatHours(defaultHours));
      setAdjustTimeRemaining(true);
    }
  }, [isOpen, initialTimeRemainingHours, deletedHours]);

  /** Parse display string back to numeric hours (e.g. "1h 30m" → 1.5, "2h" → 2, "30m" → 0.5) */
  const parseInputToHours = (val: string): number => {
    const cleaned = val.trim().toLowerCase();
    if (!cleaned || cleaned === "0") return 0;

    let totalHours = 0;
    const hourMatch = cleaned.match(/(\d+(?:\.\d+)?)h/);
    const minMatch = cleaned.match(/(\d+)m/);

    if (hourMatch) totalHours += parseFloat(hourMatch[1]);
    if (minMatch) totalHours += parseInt(minMatch[1]) / 60;

    // Plain number without unit = hours
    if (!hourMatch && !minMatch) {
      const plain = parseFloat(cleaned);
      if (!isNaN(plain) && plain >= 0) totalHours = plain;
    }

    return totalHours;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setNewTimeEstimatedHours(parseInputToHours(e.target.value));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#091E42]/50 dark:bg-[#091E42]/80 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#22272B] rounded-[3px] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-4">
          <AlertTriangle className="w-6 h-6 text-[#DE350B]" />
          <h2 className="text-[20px] font-medium text-[#172B4D] dark:text-[#B6C2CF] leading-tight">
            Delete worklog entry?
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 text-[14px] text-[#172B4D] dark:text-[#B6C2CF]">
          <p className="mb-4">Once you delete, it&apos;s gone for good.</p>

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[#DFE1E6] dark:border-[#A6C5E2]/20 text-[#0052CC] bg-white dark:bg-[#22272B] checked:bg-[#0052CC] checked:border-[#0052CC]"
              checked={adjustTimeRemaining}
              onChange={(e) => setAdjustTimeRemaining(e.target.checked)}
            />
            <span className="font-medium text-[#172B4D] dark:text-[#B6C2CF]">Adjust time remaining</span>
          </label>

          {adjustTimeRemaining && (
            <div className="flex items-start gap-4 mb-2">
              <div className="flex flex-col flex-shrink-0 w-16">
                <span className="text-[12px] font-semibold text-[#6B778C] dark:text-[#A6C5E2] mb-1">Current</span>
                <div className="flex items-center gap-3 h-[34px]">
                  <span>{formatHours(initialTimeRemainingHours)}</span>
                  <span className="text-[#6B778C]">→</span>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-[12px] font-semibold text-[#6B778C] dark:text-[#A6C5E2] mb-1">
                  New time remaining <span className="text-[#DE350B]">*</span>
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1.5 text-[14px] bg-white dark:bg-[#22272B] border-2 border-[#DFE1E6] dark:border-[#A6C5E2]/20 rounded-[3px] focus:border-[#4C9AFF] focus:bg-white outline-none text-[#172B4D] dark:text-[#B6C2CF]"
                />
                <p className="text-[11px] text-[#6B778C] dark:text-[#8C9BAB] mt-1">
                  Deleted time ({formatHours(deletedHours)}) has been added to time remaining. You can adjust this value manually.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 flex justify-end gap-2">
          <button
            onClick={() => onConfirm(adjustTimeRemaining, newTimeEstimatedHours)}
            className="px-3 py-1.5 bg-[#0052CC] hover:bg-[#0047B3] text-white text-[14px] font-medium rounded-[3px] transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 hover:bg-[#091E42]/5 dark:hover:bg-[#A6C5E2]/10 text-[#172B4D] dark:text-[#B6C2CF] text-[14px] font-medium rounded-[3px] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
