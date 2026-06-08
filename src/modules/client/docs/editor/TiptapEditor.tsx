"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import DOMPurify from "dompurify";
import "highlight.js/styles/github.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDocsStore } from "../store/docs.store";
import EditorToolbar from "./EditorToolbar";
import EditorHeader from "./EditorHeader";
import { WORKSPACE_PERMISSIONS } from "@/modules/client/workspaces/constants/workspacePermissions";
import { useWorkspacePermission } from "@/modules/client/workspaces/hooks/useWorkspacePermission";
import { getEditorExtensions } from "./editorExtensions";

const sanitizeEditorHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "target", "rel", "colspan", "rowspan", "width", "height", "data-align"],
  });

export default function TiptapEditor() {
  const { documents, selectedDocumentId, updateDocument, saveDocument, deleteDocument } = useDocsStore();
  const document = documents.find((d) => d.id === selectedDocumentId);
  const documentContent = document?.content ?? "";
  const isTemporaryDocument = Boolean(document?.id.startsWith("temp-"));
  const { hasPermission } = useWorkspacePermission(document?.workspaceId ?? "");
  const canEditPage = hasPermission(WORKSPACE_PERMISSIONS.PAGE_EDIT);

  const latestContentRef = useRef<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions("Enter content here..."),
    content: document?.content || "",
    editable: canEditPage,
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose m-5 max-w-none px-2 pb-32 text-[#111111] focus:outline-none dark:prose-invert dark:text-[#E8E8E7] prose-strong:text-[#111111] dark:prose-strong:text-[#E8E8E7]",
      },
    },
    onUpdate: ({ editor }) => {
      if (!selectedDocumentId || !canEditPage) return;

      const html = sanitizeEditorHtml(editor.getHTML());
      latestContentRef.current = html;
      updateDocument(selectedDocumentId, { content: html });
      setHasUnsavedChanges(true);
    },
  });

  useEffect(() => {
    if (!editor || !selectedDocumentId) return;

    if (latestContentRef.current !== documentContent) {
      editor.commands.setContent(documentContent, { emitUpdate: false });
      latestContentRef.current = documentContent;
    }
  }, [selectedDocumentId, editor, documentContent]);

  useEffect(() => {
    setHasUnsavedChanges(Boolean(selectedDocumentId?.startsWith("temp-")));
  }, [selectedDocumentId]);

  const handleSave = useCallback(async () => {
    if (!document) return;
    const savedDoc = await saveDocument(document.id);
    if (savedDoc) {
      latestContentRef.current = savedDoc.content;
      setHasUnsavedChanges(false);
    }
  }, [document, saveDocument]);

  const handleCancel = useCallback(() => {
    if (!document || !document.id.startsWith("temp-")) return;
    deleteDocument(document.id);
  }, [deleteDocument, document]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  if (!document) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#202020] overflow-hidden">
      <EditorHeader
        doc={document}
        canSave={canEditPage}
        canCancel={isTemporaryDocument}
        hasUnsavedChanges={hasUnsavedChanges}
        onCancel={handleCancel}
        onSave={handleSave}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#202020]">
        <div className="sticky top-0 z-20">{canEditPage && <EditorToolbar editor={editor} />}</div>

        <div className="mx-auto w-full max-w-[75rem] px-6 py-16 lg:px-10">
          <div className="mb-10">
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
              Document Title
            </p>
            <div className="rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-5 py-4 transition focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6]">
              <input
                type="text"
                value={document.title}
                onChange={(e) => {
                  updateDocument(document.id, { title: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                readOnly={!canEditPage}
                className="w-full text-4xl font-extrabold border-none outline-none focus:ring-0 bg-transparent text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] transition-all tracking-tight leading-tight"
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
      </div>
    </div>
  );
}

