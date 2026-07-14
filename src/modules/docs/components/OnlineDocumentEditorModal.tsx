"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  Bookmark,
  CheckCircle2,
  Download,
  History,
  Loader2,
  Save,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import EditorToolbar from "../editor/EditorToolbar";
import { getEditorExtensions } from "../editor/editorExtensions";
import FindReplacePanel from "../editor/FindReplacePanel";
import PageCanvas from "../editor/PageCanvas";
import TableContextMenu from "../editor/TableContextMenu";
import VersionHistorySidebar from "../editor/VersionHistorySidebar";
import type { DocumentVersion } from "../types/docs.type";

const sanitizeEditorHtml = (html: string): string => {
  if (typeof window === "undefined") return html;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DP = require("dompurify");
  return DP.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "target", "rel", "colspan", "rowspan", "width", "height", "data-align"],
  });
};

const cleanPastedHTML = (html: string): string => {
  let clean = html.replace(/<!--[\s\S]*?-->/g, "");
  clean = clean.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/font-family:[^;"]*;?/gi, "");
  clean = clean.replace(/\bMso\w+\b/g, "");
  return clean;
};

type Props = {
  doc: DocumentItem;
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: DocumentItem) => void;
};

export default function OnlineDocumentEditorModal({ doc, open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("saved");
  const [title, setTitle] = useState(doc.name);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [tableMenu, setTableMenu] = useState<{ x: number; y: number } | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isImportingDocx, setIsImportingDocx] = useState(false);
  const [mounted, setMounted] = useState(false);
  const activeDocIdRef = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions(" "),
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose max-w-none pb-32 text-[#111111] focus:outline-none dark:prose-invert dark:text-[#E8E8E7] prose-strong:text-[#111111] dark:prose-strong:text-[#E8E8E7]",
        spellcheck: "false",
        autocorrect: "off",
        autocapitalize: "off",
      },
      transformPastedHTML: cleanPastedHTML,
    },
    onUpdate: () => setStatus("idle"),
  });

  const statusLabel = useMemo(() => {
    if (status === "saving") return "Saving...";
    if (status === "saved") return "Saved";
    return "Unsaved";
  }, [status]);

  const hasUnsavedChanges = open && !loading && status !== "saved";

  const loadContent = useCallback(async () => {
    if (!editor) return;
    setLoading(true);
    try {
      const res = await documentService.getContent(doc._id);
      editor.commands.setContent(res.content || "", { emitUpdate: false });
      setStatus("saved");
    } catch {
      toast.error("Can not load document content");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [doc._id, editor, onClose]);

  const saveContent = useCallback(async () => {
    if (!editor) return;
    setStatus("saving");
    try {
      let updatedDoc = doc;
      const nextTitle = title.trim();

      if (nextTitle && nextTitle !== doc.name) {
        updatedDoc = await documentService.rename(doc._id, nextTitle);
      }

      const sanitized = sanitizeEditorHtml(editor.getHTML());
      updatedDoc = await documentService.updateContent(doc._id, sanitized);
      setStatus("saved");
      onSaved?.(updatedDoc);
      toast.success("Document saved successfully");
    } catch (error) {
      setStatus("idle");
      toast.error("Failed to save document");
      throw error;
    }
  }, [doc, editor, onSaved, title]);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const data = await documentService.getVersions(doc._id);
      setVersions(data);
    } catch {
      toast.error("Can not load version history");
    } finally {
      setVersionsLoading(false);
    }
  }, [doc._id]);

  const handleToggleVersionHistory = useCallback(() => {
    setRightSidebarOpen((open) => !open);
    void loadVersions();
  }, [loadVersions]);

  const handleCreateVersion = useCallback(async (label: string) => {
    if (!editor) return;
    setIsPublishing(true);
    try {
      await saveContent();
      const version = await documentService.createVersion(doc._id, label);
      setVersions((prev) => [version, ...prev]);
      setShowVersionModal(false);
      toast.success("Version created successfully");
    } catch {
      toast.error("Failed to create version");
    } finally {
      setIsPublishing(false);
    }
  }, [doc._id, editor, saveContent]);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    const restored = await documentService.restoreVersion(doc._id, versionId);
    const content = await documentService.getContent(doc._id);
    editor?.commands.setContent(content.content || "", { emitUpdate: false });
    setStatus("saved");
    onSaved?.(restored);
    toast.success("Version restored successfully");
    return restored;
  }, [doc._id, editor, onSaved]);

  const handleExportDocx = useCallback(async () => {
    setIsExportingDocx(true);
    try {
      if (status === "idle") {
        await saveContent();
      }
      await documentService.exportDocx(doc._id, title || doc.name);
      toast.success("Word file exported successfully");
    } catch {
      toast.error("Failed to export Word file");
    } finally {
      setIsExportingDocx(false);
    }
  }, [doc._id, doc.name, saveContent, status, title]);

  const handleImportDocx = useCallback(async (file: File) => {
    if (!editor) return;
    const confirmed = window.confirm("Importing Word will replace the current document content. Continue?");
    if (!confirmed) return;

    setIsImportingDocx(true);
    try {
      const html = await documentService.importDocx(file);
      editor.commands.setContent(html);
      setStatus("idle");
      toast.success("Word file imported successfully");
    } catch {
      toast.error("Failed to import Word file");
    } finally {
      setIsImportingDocx(false);
    }
  }, [editor]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const cell = target.closest("td, th");
    if (cell && editor) {
      e.preventDefault();
      setTableMenu({ x: e.clientX, y: e.clientY });
    }
  }, [editor]);

  useEffect(() => {
    if (!open || !editor) return;
    if (activeDocIdRef.current !== doc._id) {
      setTitle(doc.name);
      activeDocIdRef.current = doc._id;
    }
    loadContent();
    void loadVersions();
  }, [open, editor, doc._id, doc.name, loadContent, loadVersions]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveContent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, saveContent]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] h-[100dvh] w-[100vw] bg-white dark:bg-[#202020]">
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] bg-white px-5 py-3 dark:border-white/[0.06] dark:bg-[#202020] print:hidden">
          <div className="flex items-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            <span>Library</span>
            <span>{">"}</span>
            <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{title || "Untitled Document"}</span>
          </div>
          <div className="flex items-center gap-2">
            {status === "saving" ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9B9A97]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {statusLabel}
              </span>
            ) : status === "saved" ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {statusLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <XCircle className="h-3.5 w-3.5" />
                {statusLabel}
              </span>
            )}
            <button
              onClick={handleToggleVersionHistory}
              className={`rounded-[4px] p-2 transition-colors ${
                rightSidebarOpen
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "text-[#787774] hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-white/5"
              }`}
              title="Version history"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="rounded-[4px] p-2 text-[#787774] transition-colors hover:bg-[#F7F6F3] disabled:opacity-50 dark:text-[#9B9A97] dark:hover:bg-white/5"
              title="Export Word"
            >
              {isExportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
            <label
              className="rounded-[4px] p-2 text-[#787774] transition-colors hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-white/5"
              title="Import Word"
            >
              {isImportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <input
                type="file"
                accept=".docx"
                disabled={isImportingDocx}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleImportDocx(file);
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={saveContent}
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={() => {
                setVersionLabel(`Version ${versions.length + 1}`);
                setShowVersionModal(true);
              }}
              disabled={isPublishing}
              className="inline-flex items-center gap-2 rounded-[6px] bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
              Version
            </button>
            <button onClick={onClose} className="rounded-[4px] p-2 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="print:hidden">
          <EditorToolbar
            editor={editor}
            onToggleFindReplace={() => setFindReplaceOpen((open) => !open)}
          />
        </div>

        <div className="flex min-h-0 flex-1 bg-white dark:bg-[#202020]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex h-full items-center justify-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading content...
              </div>
            ) : (
              <PageCanvas>
                <div className="mb-6 print:mb-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setStatus("idle");
                    }}
                    className="w-full border-none bg-transparent text-4xl font-extrabold leading-tight tracking-tight text-[#111111] outline-none placeholder:text-[#ABABAB] focus:ring-0 dark:text-[#E8E8E7] dark:placeholder:text-[#6B6B6B] print:text-black"
                    placeholder="Enter document title..."
                  />
                  <div className="mt-3 h-px bg-gray-200/60 dark:bg-gray-800 print:hidden" />
                </div>

                <div
                  className="min-h-[800px] text-gray-900 dark:text-[#E8E8E7] print:min-h-0"
                  onContextMenu={handleContextMenu}
                >
                  <EditorContent editor={editor} />
                </div>
              </PageCanvas>
            )}
          </div>
          {findReplaceOpen && (
            <FindReplacePanel
              editor={editor}
              onClose={() => setFindReplaceOpen(false)}
            />
          )}
          {tableMenu && editor && (
            <TableContextMenu
              editor={editor}
              x={tableMenu.x}
              y={tableMenu.y}
              onClose={() => setTableMenu(null)}
            />
          )}
          {rightSidebarOpen && (
            <aside className="w-[320px] shrink-0 border-l border-[#EAEAEA] bg-white dark:border-white/[0.06] dark:bg-[#202020] print:hidden">
              <VersionHistorySidebar
                versions={versions}
                isLoading={versionsLoading}
                onRestore={handleRestoreVersion}
              />
            </aside>
          )}
        </div>
      </div>

      {showVersionModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (versionLabel.trim()) {
                void handleCreateVersion(versionLabel.trim());
              }
            }}
            className="w-full max-w-sm rounded-[10px] border border-[#EAEAEA] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/[0.06] dark:bg-[#202020]"
          >
            <h3 className="mb-2 text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Create named version</h3>
            <input
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              className="mb-4 w-full rounded-[6px] border border-[#EAEAEA] bg-[#F7F6F3] px-3 py-2 text-[0.8125rem] text-[#111111] outline-none transition-colors placeholder:text-[#ABABAB] focus:border-[#2563EB] focus:bg-white dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#E8E8E7] dark:placeholder:text-[#6B6B6B] dark:focus:border-[#3B82F6] dark:focus:bg-[#252525]"
              placeholder="Version name"
              maxLength={100}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowVersionModal(false)}
                className="rounded-[6px] border border-[#EAEAEA] px-4 py-2 text-[0.8125rem] font-medium text-[#787774] transition-colors hover:bg-[#F7F6F3] dark:border-white/[0.06] dark:text-[#9B9A97] dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPublishing || !versionLabel.trim()}
                className="rounded-[6px] bg-[#2563EB] px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    ,
    document.body,
  );
}
