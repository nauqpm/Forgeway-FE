"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import DOMPurify from "dompurify";
import { CheckCircle2, Loader2, Save, X, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import EditorToolbar from "../editor/EditorToolbar";
import { getEditorExtensions } from "../editor/editorExtensions";

const sanitizeEditorHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "target", "rel", "colspan", "rowspan", "width", "height", "data-align"],
  });

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
  const activeDocIdRef = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions(" "),
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose m-5 max-w-none px-2 pb-32 text-slate-900 focus:outline-none dark:prose-invert dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-slate-100",
      },
    },
    onUpdate: () => setStatus("idle"),
  });

  const statusLabel = useMemo(() => {
    if (status === "saving") return "Saving...";
    if (status === "saved") return "Saved";
    return "Unsaved";
  }, [status]);

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
    } catch {
      setStatus("idle");
      toast.error("Failed to save document");
    }
  }, [doc, editor, onSaved, title]);

  useEffect(() => {
    if (!open || !editor) return;
    if (activeDocIdRef.current !== doc._id) {
      setTitle(doc.name);
      activeDocIdRef.current = doc._id;
    }
    loadContent();
  }, [open, editor, doc._id, doc.name, loadContent]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Workspace</span>
            <span>{">"}</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{title || "Untitled Document"}</span>
          </div>
          <div className="flex items-center gap-2">
            {status === "saving" ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
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
              onClick={saveContent}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <EditorToolbar editor={editor} />

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-950">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading content...
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[1200px] px-6 py-16 lg:px-10">
              <div className="mb-10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Document Title
                </p>
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/50 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-900/40">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setStatus("idle");
                    }}
                    className="w-full bg-transparent text-4xl font-extrabold leading-tight tracking-tight text-[#172B4D] outline-none placeholder:text-slate-400 dark:text-gray-100 dark:placeholder:text-slate-500"
                    placeholder="Enter document title..."
                  />
                </div>
              </div>

              <div className="pb-40">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Document Content
                </p>
                <div className="min-h-[600px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/50 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-900/40">
                  <div className="dark:prose-invert">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
