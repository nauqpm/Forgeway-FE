"use client";

import { X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { BoardColumn } from "../types/board.type";

type DeleteColumnModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (migrateTo?: string) => void;
  column: BoardColumn | null;
  columns: BoardColumn[];
  hasTasks: boolean;
};

export default function DeleteColumnModal({
  isOpen,
  onClose,
  onConfirm,
  column,
  columns,
  hasTasks,
}: DeleteColumnModalProps) {
  const [migrateTo, setMigrateTo] = useState<string>("");

  if (!isOpen || !column) return null;

  const otherColumns = columns.filter((c) => c.id !== column.id);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasTasks && !migrateTo) return;
    onConfirm(hasTasks ? migrateTo : undefined);
    setMigrateTo("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-md border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#9F2F2D]" />
            Delete column {column.name}
          </h3>
          <button
            onClick={onClose}
            className="text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          {hasTasks ? (
            <>
              <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                This column contains work items. Choose another column to move these work items to before deleting it.
              </p>
              <div>
                <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
                  Move work items to column: <span className="text-[#9F2F2D]">*</span>
                </label>
                <select
                  required
                  value={migrateTo}
                  onChange={(e) => setMigrateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#9F2F2D] text-[0.8125rem] outline-none transition-colors"
                >
                  <option value="" disabled>Select column</option>
                  {otherColumns.map((col) => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
              Are you sure you want to delete this column? This action cannot be undone.
            </p>
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
              disabled={hasTasks && !migrateTo}
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
