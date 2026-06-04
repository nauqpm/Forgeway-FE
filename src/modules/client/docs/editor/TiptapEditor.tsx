"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import DOMPurify from "dompurify";
import "highlight.js/styles/github.css";

import { useEffect, useRef, useCallback } from "react";
import { useDocsStore } from "../store/docs.store";
import EditorToolbar from "./EditorToolbar";
import EditorHeader from "./EditorHeader";
import { WORKSPACE_PERMISSIONS } from "@/modules/client/workspaces/constants/workspacePermissions";
import { useWorkspacePermission } from "@/modules/client/workspaces/hooks/useWorkspacePermission";
import { getEditorExtensions } from "./editorExtensions";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";

const EMIT_DELAY = 300;

const sanitizeEditorHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style", "target", "rel", "colspan", "rowspan", "width", "height", "data-align"],
  });

export default function TiptapEditor() {
  const { documents, selectedDocumentId, updateDocument, setIsSaving } = useDocsStore();
  const document = documents.find((d) => d.id === selectedDocumentId);
  const { hasPermission } = useWorkspacePermission(document?.workspaceId ?? "");
  const canEditPage = hasPermission(WORKSPACE_PERMISSIONS.PAGE_EDIT);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<string>("");
  const draftContentRef = useRef<string | null>(null);

  const emitUpdate = useCallback(
    (content: string) => {
      if (!selectedDocumentId) return;
      const socket = realtimeSocketClient.getSocket();
      if (socket && socket.connected) {
        setIsSaving(true);
        realtimeSocketClient.pageManager.update(socket, sanitizeEditorHtml(content), () => {
          setIsSaving(false);
        });
      }
    },
    [selectedDocumentId, setIsSaving],
  );



  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions("Enter content here..."),
    content: document?.content || "",
    editable: canEditPage,
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose m-5 focus:outline-none max-w-none px-2 pb-32",
      },
    },
    onUpdate: ({ editor }) => {
      if (!selectedDocumentId || !canEditPage) return;

      const html = editor.getHTML();
      latestContentRef.current = html;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        emitUpdate(html);
      }, EMIT_DELAY);
    },
  });

  useEffect(() => {
    if (!selectedDocumentId) return;
    
    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    realtimeSocketClient.pageManager.join(socket, selectedDocumentId, (draft) => {
      if (draft !== undefined) {
        draftContentRef.current = draft;
        if (editor && latestContentRef.current !== draft) {
          latestContentRef.current = draft;
          editor.commands.setContent(draft, { emitUpdate: false });
        }
      }
    });

    const handlePageUpdated = (data: { pageId: string; content: string; editedBy: string }) => {
      if (data.pageId === selectedDocumentId && editor) {
        latestContentRef.current = data.content;
        // Tiptap setContent signature might expect options object
        editor.commands.setContent(data.content, { emitUpdate: false });
      }
    };

    socket.on(SOCKET_EVENTS.PAGE_UPDATED, handlePageUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.PAGE_UPDATED, handlePageUpdated);
      realtimeSocketClient.pageManager.leave(socket);
      draftContentRef.current = null;
    };
  }, [selectedDocumentId, editor]);

  useEffect(() => {
    if (editor && document) {
      const contentToSet = draftContentRef.current ?? document.content;
      if (latestContentRef.current !== contentToSet) {
        editor.commands.setContent(contentToSet);
        latestContentRef.current = contentToSet;
      }
    }
  }, [selectedDocumentId, editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!document) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
      <EditorHeader doc={document} />

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-950">
        <div className="sticky top-0 z-20">{canEditPage && <EditorToolbar editor={editor} />}</div>

        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 lg:px-10">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Document Title
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/50 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-900/40">
              <input
                type="text"
                value={document.title}
                onChange={(e) => updateDocument(document.id, { title: e.target.value })}
                readOnly={!canEditPage}
                className="w-full text-4xl font-extrabold border-none outline-none focus:ring-0 bg-transparent text-[#172B4D] dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all tracking-tight leading-tight"
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
      </div>
    </div>
  );
}

