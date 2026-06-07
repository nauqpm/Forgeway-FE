"use client";

import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import { ChevronRight, Globe, Loader2, Upload, Eye, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import type { EditorMode } from "./TiptapEditor";
import type { RealtimeStatusSnapshot } from "@/lib/socket/socket.types";

interface EditorHeaderProps {
  doc: Document;
  mode: EditorMode;
  canEdit: boolean;
  connectionStatus: RealtimeStatusSnapshot["status"];
  isPublishing: boolean;
  onToggleMode: () => void;
  onPublish: () => void;
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

export default function EditorHeader({
  doc,
  mode,
  canEdit,
  connectionStatus,
  isPublishing,
  onToggleMode,
  onPublish,
}: EditorHeaderProps) {
  const { documents } = useDocsStore();
  const [title, setTitle] = useState(doc.title);

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
    <div className="flex flex-col bg-white dark:bg-gray-950 shrink-0">
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
          {/* Connection indicator (Edit mode only) */}
          {mode === "edit" && <ConnectionIndicator status={connectionStatus} />}

          {/* Disconnected warning banner (Edit mode only) */}
          {mode === "edit" && (connectionStatus === "disconnected" || connectionStatus === "error") && (
            <span className="hidden sm:inline-flex items-center text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
              Thay đổi được lưu cục bộ. Đang kết nối lại...
            </span>
          )}

          {/* Mode toggle button */}
          {canEdit && (
            <button
              onClick={onToggleMode}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
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

          {/* Update (Publish) button — Edit mode only */}
          {mode === "edit" && canEdit && (
            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Cập nhật
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
