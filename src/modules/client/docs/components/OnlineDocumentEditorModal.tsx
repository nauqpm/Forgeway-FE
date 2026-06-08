"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { CheckCircle2, Loader2, Save, X, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";
import EditorToolbar from "../editor/EditorToolbar";
import { getEditorExtensions } from "../editor/editorExtensions";

const sanitizeEditorHtml = (html: string): string => {
  if (typeof window === "undefined") return html;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DP = require("dompurify");
  return DP.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "target", "rel", "colspan", "rowspan", "width", "height", "data-align"],
  });
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
  const activeDocIdRef = useRef<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions(" "),
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose m-5 max-w-none px-2 pb-32 text-[#111111] focus:outline-none dark:prose-invert dark:text-[#E8E8E7] prose-strong:text-[#111111] dark:prose-strong:text-[#E8E8E7]",
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
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#202020]">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] bg-white px-5 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
          <div className="flex items-center gap-2 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            <span>Workspace</span>
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
              onClick={saveContent}
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button onClick={onClose} className="rounded-[4px] p-2 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <EditorToolbar editor={editor} />

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#202020]">
          {loading ? (
            <div className="flex h-full items-center justify-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading content...
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[75rem] px-6 py-16 lg:px-10">
              <div className="mb-10">
                <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
                  Document Title
                </p>
                <div className="rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-5 py-4 transition focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6]">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setStatus("idle");
                    }}
                    className="w-full bg-transparent text-4xl font-extrabold leading-tight tracking-tight text-[#111111] dark:text-[#E8E8E7] outline-none placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]"
                    placeholder="Enter document title..."
                  />
                </div>
              </div>

              <div className="pb-40">
                <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
                  Document Content
                </p>
                <div className="min-h-[37.5rem] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-4 py-3 transition focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6]">
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
