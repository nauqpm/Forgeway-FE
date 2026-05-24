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
    <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            Xóa cột {column.name}
          </h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-5 bg-gray-50/30 dark:bg-gray-900">
          {hasTasks ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cột này đang chứa các công việc. Bạn cần chọn một cột khác để chuyển các công việc này sang trước khi xóa.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Chuyển công việc sang cột: <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={migrateTo}
                  onChange={(e) => setMigrateTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="" disabled>Chọn cột</option>
                  {otherColumns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bạn có chắc chắn muốn xóa cột này không? Hành động này không thể hoàn tác.
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={hasTasks && !migrateTo}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Xác nhận xóa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
