// Component representing sidebar displaying version history,
// allowing users to view saved versions, preview them, and restore to a specific version.
"use client";

import { useState } from "react";
import { History, Eye, RotateCcw, AlertTriangle, X, Calendar, User, FileText } from "lucide-react";
import type { DocumentVersion } from "../types/docs.type";

interface VersionHistorySidebarProps {
  versions: DocumentVersion[];
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRestore: (versionId: string) => Promise<any>;
}

export default function VersionHistorySidebar({
  versions,
  isLoading,
  onRestore,
}: VersionHistorySidebarProps) {
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const handleConfirmRestore = async (versionId: string) => {
    setIsRestoring(true);
    try {
      await onRestore(versionId);
      setConfirmRestoreId(null);
      setPreviewVersion(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 text-slate-700 dark:text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/60 dark:border-gray-800 flex items-center gap-2">
        <History className="w-[18px] h-[18px] text-indigo-500" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Version History</h3>
      </div>

      {/* Info Card */}
      <div className="p-3 mx-3 mt-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg text-xs text-indigo-600 dark:text-indigo-400">
        Restore document content to a specific version.
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading list...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <History className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
            <span className="text-xs text-slate-400 dark:text-slate-500">No named versions yet.</span>
          </div>
        ) : (
          versions.map((ver) => (
            <div
              key={ver.id}
              className="group p-3 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100/80 dark:hover:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800 rounded-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-1.5 mb-1.5">
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate" title={ver.label}>
                    {ver.label}
                  </h4>
                  <span className="inline-block px-1.5 py-0.5 mt-1 text-[10px] font-medium bg-slate-200/80 dark:bg-gray-800 text-slate-600 dark:text-slate-400 rounded-md">
                    v{ver.version}
                  </span>
                </div>
              </div>

              {/* Version details */}
              <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 opacity-60" />
                  <span>{formatTime(ver.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 opacity-60" />
                  <span className="truncate">{ver.createdBy.fullName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewVersion(ver)}
                  className="flex-1 py-1.5 px-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setConfirmRestoreId(ver.id)}
                  className="py-1.5 px-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-[11px] font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center"
                  title="Restore"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-6 animate-fade-in">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-gray-900 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                    Preview: {previewVersion.label}
                  </h3>
                  <span className="px-1.5 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-md shrink-0">
                    v{previewVersion.version}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Created at {formatTime(previewVersion.createdAt)} by {previewVersion.createdBy.fullName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmRestoreId(previewVersion.id)}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore this version</span>
                </button>
                <button
                  onClick={() => setPreviewVersion(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Page Canvas Simulator */}
            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-gray-900 p-4 md:p-6 custom-scrollbar">
              <div className="mx-auto bg-white dark:bg-gray-950 shadow-md border border-gray-200/60 dark:border-gray-800 w-full max-w-[816px] min-h-[1056px] p-12 md:p-24 text-slate-900 dark:text-slate-100 prose prose-slate max-w-none prose-sm sm:prose-base dark:prose-invert">
                <div
                  dangerouslySetInnerHTML={{ __html: previewVersion.htmlSnapshot }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmRestoreId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 w-full max-w-md animate-scale-up">
            <div className="flex items-start gap-3 text-amber-500 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 stroke-[2]" />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  Restore version?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  The current document content will be completely overwritten by the restored version content. Active users will receive the new content. This action cannot be directly undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                disabled={isRestoring}
                onClick={() => setConfirmRestoreId(null)}
                className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isRestoring}
                onClick={() => handleConfirmRestore(confirmRestoreId)}
                className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 flex items-center gap-1.5"
              >
                {isRestoring ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
