// Component đại diện cho phần header của trang editor tài liệu, bao gồm breadcrumbs hiển thị đường dẫn thư mục của tài liệu hiện tại,
// danh sách cộng tác viên đang hoạt động, trạng thái kết nối thời gian thực, trạng thái lưu tự động,
// và các nút điều khiển để chuyển đổi giữa chế độ xem và chỉnh sửa, mở lịch sử phiên bản, bật/tắt chế độ đề xuất sửa đổi, v.v.
"use client";

import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import { ChevronRight, Globe, Loader2, Eye, Pencil, Cloud, Check, AlertCircle, History, Bookmark, FileText, Download, Upload, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import type { EditorMode } from "./TiptapEditor";
import type { RealtimeStatusSnapshot } from "@/lib/socket/socket.types";

interface EditorHeaderProps {
  doc: Document;
  mode: EditorMode;
  canEdit: boolean;
  connectionStatus: RealtimeStatusSnapshot["status"];
  saveStatus?: "saving" | "saved" | "error" | "idle";
  isPublishing: boolean;
  awareness?: any;
  onToggleMode: () => void;
  onCreateVersion: (label: string) => Promise<void>;
  isCommentsOpen: boolean;
  onToggleComments: () => void;
  isVersionHistoryOpen: boolean;
  onToggleVersionHistory: () => void;
  isSuggestionModeActive: boolean;
  onToggleSuggestionMode: () => void;
  isSuggestionsOpen: boolean;
  onToggleSuggestions: () => void;
  isExportingDocx: boolean;
  onExportDocx: () => void;
  isImportingDocx: boolean;
  onImportDocx: (file: File) => void;
}

// ── Collaborators list ────────────────────────────────────────
function CollaboratorsList({ awareness }: { awareness: any }) {
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateCollaborators = () => {
      const states = Array.from(awareness.getStates().values());
      const active = states
        .map((s: any) => s.user)
        .filter((u: any) => u && u.name);
      
      const unique: any[] = [];
      const seen = new Set();
      for (const c of active) {
        if (!seen.has(c.name)) {
          seen.add(c.name);
          unique.push(c);
        }
      }
      setCollaborators(unique);
    };

    awareness.on("change", updateCollaborators);
    updateCollaborators();

    return () => {
      awareness.off("change", updateCollaborators);
    };
  }, [awareness]);

  if (collaborators.length === 0) return null;

  const maxVisible = 3;
  const visible = collaborators.slice(0, maxVisible);
  const extraCount = collaborators.length - maxVisible;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden mr-2 select-none">
      {visible.map((c, i) => {
        const initial = c.name ? c.name.charAt(0).toUpperCase() : "?";
        return (
          <div
            key={i}
            title={c.name}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-950 cursor-default transition-transform hover:scale-110"
            style={{
              backgroundColor: c.color || "#3B82F6",
              zIndex: 10 - i,
            }}
          >
            {initial}
          </div>
        );
      })}
      {extraCount > 0 && (
        <div
          title={`${extraCount} người khác`}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-150 border-2 border-white text-[9px] font-extrabold text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-950 z-0"
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
}

// ── Connection status indicator ──────────────────────────────
function ConnectionIndicator({ status }: { status: RealtimeStatusSnapshot["status"] }) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Đang cộng tác
      </span>
    );
  }

  if (status === "connecting") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        Đang kết nối...
      </span>
    );
  }

  if (status === "disconnected" || status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        Mất kết nối
      </span>
    );
  }

  return null;
}

// ── Save status indicator ──────────────────────────────
function SaveStatusIndicator({ status }: { status: "saving" | "saved" | "error" | "idle" }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
        Đang lưu...
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400" title="Tất cả thay đổi đã được lưu">
        <Cloud className="h-3.5 w-3.5" />
        Đã lưu
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400" title="Không thể lưu tự động. Kiểm tra kết nối mạng.">
        <AlertCircle className="h-3.5 w-3.5" />
        Lỗi lưu tự động
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
      <Check className="h-3.5 w-3.5" />
      Đã lưu
    </span>
  );
}

export default function EditorHeader({
  doc,
  mode,
  canEdit,
  connectionStatus,
  saveStatus,
  isPublishing,
  awareness,
  onToggleMode,
  onCreateVersion,
  isCommentsOpen,
  onToggleComments,
  isVersionHistoryOpen,
  onToggleVersionHistory,
  isSuggestionModeActive,
  onToggleSuggestionMode,
  isSuggestionsOpen,
  onToggleSuggestions,
  isExportingDocx,
  onExportDocx,
  isImportingDocx,
  onImportDocx,
}: EditorHeaderProps) {
  const { documents } = useDocsStore();
  const [title, setTitle] = useState(doc.title);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");

  const handleOpenVersionModal = () => {
    setVersionLabel(`Bản thảo v${doc.version}`);
    setShowVersionModal(true);
  };

  const handleCreateVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionLabel.trim()) return;
    try {
      await onCreateVersion(versionLabel.trim());
      setShowVersionModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setTitle(doc.title);
  }, [doc.id, doc.title]);

  const getBreadcrumbs = (currentDoc: Document): Document[] => {
    const breadcrumbs: Document[] = [currentDoc];
    let parentId = currentDoc.parentId;
    while (parentId) {
      const parent = documents.find((d) => d.id === parentId);
      if (parent) {
        breadcrumbs.unshift(parent);
        parentId = parent.parentId;
      } else {
        break;
      }
    }
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(doc);

  return (
    <div className="flex flex-col bg-white dark:bg-gray-950 shrink-0 print:hidden">
      {/* Breadcrumbs + Controls Row */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100 dark:border-gray-800">
        {/* Left — Breadcrumbs */}
        <div className="flex items-center text-[12px] text-gray-500 dark:text-gray-400 overflow-hidden flex-1">
          <Globe className="w-3.5 h-3.5 mr-2 text-gray-400 dark:text-gray-500" />
          <span className="hover:underline cursor-pointer">Workspace</span>
          {breadcrumbs.map((b, index) => (
            <span key={b.id} className="flex items-center shrink-0">
              <ChevronRight className="w-3.5 h-3.5 mx-0.5 text-gray-400 dark:text-gray-600" />
              <span
                className={`truncate max-w-[150px] ${
                  index === breadcrumbs.length - 1
                    ? "text-gray-900 dark:text-gray-200 font-medium"
                    : "hover:underline cursor-pointer"
                }`}
              >
                {b.title}
              </span>
            </span>
          ))}
        </div>

        {/* Right — Controls */}
        <div className="flex items-center gap-2 ml-4">
          {/* Active Collaborators list */}
          {mode === "edit" && awareness && <CollaboratorsList awareness={awareness} />}

          {/* Connection indicator (Edit mode only) */}
          {mode === "edit" && <ConnectionIndicator status={connectionStatus} />}

          {/* Save status indicator (Edit mode only) */}
          {mode === "edit" && saveStatus && <SaveStatusIndicator status={saveStatus} />}

          {/* Disconnected warning banner (Edit mode only) */}
          {mode === "edit" && (connectionStatus === "disconnected" || connectionStatus === "error") && (
            <span className="hidden sm:inline-flex items-center text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
              Thay đổi được lưu cục bộ. Đang kết nối lại...
            </span>
          )}

          {/* Suggestions Sidebar Toggle Button */}
          {mode === "edit" && (
            <button
              onClick={onToggleComments}
              className={`inline-flex items-center justify-center p-1.25 rounded-md border transition-all ${
                isCommentsOpen
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400"
                  : "bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              title="Bình luận"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}

          {/* Suggestions Sidebar Toggle Button */}
          {mode === "edit" && canEdit && (
            <button
              onClick={onToggleSuggestions}
              className={`inline-flex items-center justify-center p-1.25 rounded-md border transition-all ${
                isSuggestionsOpen
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400"
                  : "bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              title="Đề xuất sửa đổi"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}

          {/* Version History Toggle Button */}
          <button
            onClick={onToggleVersionHistory}
            className={`inline-flex items-center justify-center p-1.25 rounded-md border transition-all ${
              isVersionHistoryOpen
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-400"
                : "bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            title="Lịch sử phiên bản"
          >
            <History className="h-4 w-4" />
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="hidden"
            title="In tài liệu / Xuất PDF"
          >
            <span className="h-4.5 w-4.5" />
          </button>

          {/* Export DOCX Button */}
          <button
            onClick={onExportDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center justify-center p-1.25 rounded-md border bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all disabled:opacity-50"
            title="Xuất file Word (.docx)"
          >
            {isExportingDocx ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>

          {/* Import DOCX Button */}
          {mode === "edit" && canEdit && (
            <label
              className="inline-flex items-center justify-center p-1.25 rounded-md border bg-white border-gray-200 text-gray-500 hover:text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all cursor-pointer"
              title="Nhập file Word (.docx)"
            >
              {isImportingDocx ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <input
                type="file"
                accept=".docx"
                disabled={isImportingDocx}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportDocx(file);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          )}

          {/* Suggestion Mode Active/Inactive Toggle Button */}
          {mode === "edit" && canEdit && (
            <button
              onClick={onToggleSuggestionMode}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all border ${
                isSuggestionModeActive
                  ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  : "bg-gray-100 border-transparent text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              title={isSuggestionModeActive ? "Chuyển sang Chỉnh sửa trực tiếp" : "Chuyển sang Đề xuất sửa đổi"}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {isSuggestionModeActive ? "Chế độ: Đề xuất" : "Chế độ: Chỉnh sửa"}
            </button>
          )}

          {/* Mode toggle button */}
          {canEdit && (
            <button
              onClick={onToggleMode}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "edit"
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              }`}
            >
              {mode === "edit" ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Xem
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </>
              )}
            </button>
          )}

          {/* Create named version button — Edit mode only */}
          {mode === "edit" && canEdit && (
            <button
              onClick={handleOpenVersionModal}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  Tạo phiên bản
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Named Version Dialog Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <form
            onSubmit={handleCreateVersionSubmit}
            className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xl w-full max-w-sm animate-scale-up"
          >
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1.5">
              Tạo phiên bản có tên
            </h4>
            <p className="text-[11px] text-slate-500 mb-4">
              Lưu trạng thái hiện tại của tài liệu để dễ dàng so sánh và khôi phục sau này.
            </p>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Tên phiên bản
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Nhập tên phiên bản (ví dụ: Bản thảo lần 1...)"
                className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-950 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isPublishing}
                onClick={() => setShowVersionModal(false)}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isPublishing || !versionLabel.trim()}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-200 flex items-center gap-1.5"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <span>Tạo bản mới</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
