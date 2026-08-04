// Component representing the header of the document editor page, including breadcrumbs showing directory path,
// list of active collaborators, real-time connection status, auto-save status,
// and control buttons to switch between view/edit modes, open version history, toggle suggestions mode, etc.
"use client";

import { Document } from "../types/docs.type";
import { ChevronLeft, ChevronRight, Globe, Loader2, Eye, Pencil, Cloud, Check, AlertCircle, History, Bookmark, FileText, Download, Upload, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import type { EditorMode } from "./TiptapEditor";
import type { RealtimeStatusSnapshot } from "@/lib/socket/socket.types";
import { useWorkspaceDocs } from "../hooks/useWorkspaceDocs";
import { useDocsStore } from "../store/docs.store";
import { buildWorkspacePagesHref } from "../utils/pageRoutes";

interface EditorHeaderProps {
  doc: Document;
  mode: EditorMode;
  canEdit: boolean;
  connectionStatus: RealtimeStatusSnapshot["status"];
  saveStatus?: "saving" | "saved" | "error" | "idle";
  isPublishing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  workspaceKey?: string;
}

// ── Collaborators list ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CollaboratorsList({ awareness }: { awareness: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateCollaborators = () => {
      const states = Array.from(awareness.getStates().values());
      const active = states
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((s: any) => s.user)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((u: any) => u && u.name);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          title={`${extraCount} others`}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-150 border-2 border-white text-[9px] font-extrabold text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-950 z-0"
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
}

// ── Connection status indicator ──────────────────────────────
function ConnectionIndicator({
  status,
}: {
  status: RealtimeStatusSnapshot["status"];
}) {
  if (status === "connected") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Collaborating
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
        Connecting...
      </span>
    );
  }

  if (status === "disconnected" || status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        Disconnected
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
        Saving...
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400" title="All changes saved">
        <Cloud className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400" title="Could not autosave. Check network connection.">
        <AlertCircle className="h-3.5 w-3.5" />
        Autosave error
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
      <Check className="h-3.5 w-3.5" />
      Saved
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
  workspaceKey,
}: EditorHeaderProps) {
  const { documents } = useWorkspaceDocs(doc.workspaceId);
  const { selectDocument } = useDocsStore();
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");

  const handleOpenVersionModal = () => {
    setVersionLabel(`Version ${doc.version}`);
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
  const iconButtonClass =
    "inline-flex items-center justify-center p-1.25 rounded-md border border-gray-200 bg-white text-gray-500 transition-all hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#202020] dark:text-gray-400 dark:hover:bg-[#252525] dark:hover:text-gray-200";
  const activeIndigoIconButtonClass =
    "inline-flex items-center justify-center p-1.25 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 transition-all hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/50";
  const activeEmeraldIconButtonClass =
    "inline-flex items-center justify-center p-1.25 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50";
  const textButtonClass =
    "inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#202020] dark:text-gray-300 dark:hover:bg-[#252525]";
  const activeTextButtonClass =
    "inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700";
  const modePreviewButtonClass =
    "inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50";
  const primaryButtonClass =
    "inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-col bg-white dark:bg-[#202020] shrink-0 print:hidden">
      {/* Breadcrumbs + Controls Row */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100 dark:border-white/[0.06]">
        {/* Left — Breadcrumbs */}
        <div className="flex items-center text-[12px] text-gray-500 dark:text-gray-400 overflow-hidden flex-1">
          <button 
            className="mr-2 p-1 -ml-2 rounded-[4px] text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7] transition-colors"
            onClick={() => {
              selectDocument(null);
              if (workspaceKey) {
                // Use pushState to stay on [[...tab]] route without remounting workspace shell
                window.history.pushState(null, "", buildWorkspacePagesHref(workspaceKey));
                window.dispatchEvent(new Event("docs-location-change"));
              }
            }}
            aria-label="Back to all documents"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Globe className="w-3.5 h-3.5 mr-2 hidden md:block text-gray-400 dark:text-gray-500" />
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
              Changes saved locally. Reconnecting...
            </span>
          )}

          {/* Suggestions Sidebar Toggle Button */}
          {mode === "edit" && (
            <button
              onClick={onToggleComments}
              className={isCommentsOpen ? activeIndigoIconButtonClass : iconButtonClass}
              title="Comments"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}

          {/* Suggestions Sidebar Toggle Button */}
          {mode === "edit" && canEdit && (
            <button
              onClick={onToggleSuggestions}
              className={isSuggestionsOpen ? activeEmeraldIconButtonClass : iconButtonClass}
              title="Suggest changes"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}

          {/* Version History Toggle Button */}
          <button
            onClick={onToggleVersionHistory}
            className={isVersionHistoryOpen ? activeIndigoIconButtonClass : iconButtonClass}
            title="Version history"
          >
            <History className="h-4 w-4" />
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="hidden"
            title="Print / Export PDF"
          >
            <span className="h-4.5 w-4.5" />
          </button>

          {/* Export DOCX Button */}
          {canEdit && (
            <button
              onClick={onExportDocx}
              disabled={isExportingDocx}
              className={iconButtonClass}
              title="Export Word (.docx)"
            >
              {isExportingDocx ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Import DOCX Button */}
          {mode === "edit" && canEdit && (
            <label
              className={`${iconButtonClass} cursor-pointer`}
              title="Import Word (.docx)"
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
              className={isSuggestionModeActive ? activeTextButtonClass : textButtonClass}
              title={isSuggestionModeActive ? "Switch to direct editing" : "Switch to suggesting changes"}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {isSuggestionModeActive ? "Mode: Suggesting" : "Mode: Editing"}
            </button>
          )}

          {/* Mode toggle button */}
          {canEdit && (
            <button
              onClick={onToggleMode}
              className={mode === "edit" ? textButtonClass : modePreviewButtonClass}
            >
              {mode === "edit" ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  View
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </>
              )}
            </button>
          )}

          {/* Create named version button — Edit mode only */}
          {mode === "edit" && canEdit && (
            <button
              onClick={handleOpenVersionModal}
              disabled={isPublishing}
              className={primaryButtonClass}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  Create version
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Named Version Dialog Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] animate-fade-in">
          <form
            onSubmit={handleCreateVersionSubmit}
            className="w-full max-w-sm animate-scale-up rounded-[10px] border border-[#EAEAEA] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/[0.06] dark:bg-[#202020]"
          >
            <h4 className="mb-1.5 text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Create named version
            </h4>
            <p className="mb-4 text-[0.8125rem] leading-5 text-[#787774] dark:text-[#9B9A97]">
              Save the current state of the document to easily compare and restore later.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                Version name
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="Enter version name (e.g. Review ready...)"
                className="w-full rounded-[6px] border border-[#EAEAEA] bg-[#F7F6F3] px-3 py-2 text-[0.8125rem] text-[#111111] outline-none transition-colors placeholder:text-[#ABABAB] focus:border-[#2563EB] focus:bg-white dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#E8E8E7] dark:placeholder:text-[#6B6B6B] dark:focus:border-[#3B82F6] dark:focus:bg-[#252525]"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isPublishing}
                onClick={() => setShowVersionModal(false)}
                className="rounded-[6px] border border-[#EAEAEA] px-4 py-2 text-[0.8125rem] font-medium text-[#787774] transition-colors hover:bg-[#F7F6F3] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.06] dark:text-[#9B9A97] dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPublishing || !versionLabel.trim()}
                className="flex items-center gap-1.5 rounded-[6px] bg-[#2563EB] px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create new</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
