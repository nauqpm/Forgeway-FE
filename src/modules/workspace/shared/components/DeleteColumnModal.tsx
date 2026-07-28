"use client";

import { X, AlertTriangle, Archive } from "lucide-react";
import { useState } from "react";
import { BoardColumn } from "../types/board.type";

type DeleteColumnModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (migrateTo?: string, archivedMigrateTo?: string) => void;
  column: BoardColumn | null;
  columns: BoardColumn[];
  hasTasks: boolean;
  hasArchivedTasks: boolean;
};

export default function DeleteColumnModal({
  isOpen,
  onClose,
  onConfirm,
  column,
  columns,
  hasTasks,
  hasArchivedTasks,
}: DeleteColumnModalProps) {
  const otherColumns = columns.filter((c) => c.id !== column.id);
  const defaultTarget = otherColumns[0]?.id || "";

  const [migrateTo, setMigrateTo] = useState<string>(() => defaultTarget);
  const [archivedMigrateTo, setArchivedMigrateTo] = useState<string>(() => defaultTarget);

  if (!isOpen || !column) return null;

  const isFormValid =
    (!hasTasks || !!migrateTo) &&
    (!hasArchivedTasks || !!archivedMigrateTo);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    onConfirm(
      hasTasks ? migrateTo : undefined,
      hasArchivedTasks ? archivedMigrateTo : undefined,
    );
    setMigrateTo("");
    setArchivedMigrateTo("");
  };

  const hasAnyTasks = hasTasks || hasArchivedTasks;

  const selectClass =
    "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#9F2F2D] text-[0.8125rem] outline-none transition-colors";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-md border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] flex items-start gap-2 min-w-0 flex-1 mr-2 mt-0.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#9F2F2D] mt-0.5" />
            <span className="break-all whitespace-normal">
              Delete column &ldquo;{column.name}&rdquo;
            </span>
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          {!hasAnyTasks && (
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
              Are you sure you want to delete this column? This action cannot be undone.
            </p>
          )}

          {/* Active tasks migration */}
          {hasTasks && (
            <div className="space-y-1.5">
              <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                This column has <strong className="text-[#111111] dark:text-[#E8E8E7]">active</strong> work items. Choose a column to move them to:
              </p>
              <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1">
                Move active tasks to: <span className="text-[#9F2F2D]">*</span>
              </label>
              <select
                required
                value={migrateTo}
                onChange={(e) => setMigrateTo(e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>Select column</option>
                {otherColumns.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Archived tasks migration */}
          {hasArchivedTasks && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                <Archive className="w-3.5 h-3.5 shrink-0 text-[#ABABAB]" />
                <span>
                  This column also has <strong className="text-[#111111] dark:text-[#E8E8E7]">archived</strong> tasks. Choose a column to move them to (they will stay archived):
                </span>
              </div>
              <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1">
                Move archived tasks to: <span className="text-[#9F2F2D]">*</span>
              </label>
              <select
                required
                value={archivedMigrateTo}
                onChange={(e) => setArchivedMigrateTo(e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>Select column</option>
                {otherColumns.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-4 py-2 bg-[#9F2F2D] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#8F2927] dark:hover:bg-[#F87171]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Confirm delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
