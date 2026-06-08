"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import DOMPurify from "dompurify";
import "highlight.js/styles/github.css";

import { useEffect, useRef, useCallback, useState } from "react";
import * as Y from "yjs";
import { useDocsStore } from "../store/docs.store";
import EditorToolbar from "./EditorToolbar";
import EditorHeader from "./EditorHeader";
import { WORKSPACE_PERMISSIONS } from "@/modules/client/workspaces/constants/workspacePermissions";
import { useWorkspacePermission } from "@/modules/client/workspaces/hooks/useWorkspacePermission";
import {
  getEditorExtensions,
  getCollaborativeEditorExtensions,
} from "./editorExtensions";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";
import { pagesService } from "../services/pages.service";
import { toast } from "react-hot-toast";
import type { RealtimeStatusSnapshot } from "@/lib/socket/socket.types";

const sanitizeEditorHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: [
      "style",
      "target",
      "rel",
      "colspan",
      "rowspan",
      "width",
      "height",
      "data-align",
    ],
  });

/**
 * Apply a minimal diff to a Y.Text so that only the changed characters are
 * transmitted, rather than a full delete+insert on every keystroke.
 * Mirrors the same pattern used in the vanilla demo (replaceYTextWithDiff).
 */
function applyYTextDiff(yText: Y.Text, nextValue: string): void {
  const current = yText.toString();
  if (current === nextValue) return;

  let prefixLength = 0;
  while (
    prefixLength < current.length &&
    prefixLength < nextValue.length &&
    current[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < current.length - prefixLength &&
    suffixLength < nextValue.length - prefixLength &&
    current[current.length - 1 - suffixLength] ===
      nextValue[nextValue.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const deleteLength = current.length - prefixLength - suffixLength;
  const insertValue = nextValue.slice(
    prefixLength,
    nextValue.length - suffixLength,
  );

  if (deleteLength > 0) yText.delete(prefixLength, deleteLength);
  if (insertValue) yText.insert(prefixLength, insertValue);
}

export type EditorMode = "read" | "edit";

export default function TiptapEditor() {
  const { documents, selectedDocumentId, updateDocument } = useDocsStore();
  const document = documents.find((d) => d.id === selectedDocumentId);
  const { hasPermission } = useWorkspacePermission(document?.workspaceId ?? "");
  const canEditPage = hasPermission(WORKSPACE_PERMISSIONS.PAGE_EDIT);

  // ── Mode state ─────────────────────────────────────────────
  const [mode, setMode] = useState<EditorMode>("read");
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Connection status ──────────────────────────────────────
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatusSnapshot["status"]>("idle");

  // ── Yjs state ──────────────────────────────────────────────
  const ydocRef = useRef<Y.Doc | null>(null);
  const pendingUpdatesRef = useRef<Uint8Array[]>([]);
  const draftContentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const remoteUpdateListenerRef = useRef<
    ((data: { pageId: string; update: number[] }) => void) | null
  >(null);
  const localUpdateListenerRef = useRef<
    ((update: Uint8Array, origin: unknown) => void) | null
  >(null);

  // ── Title state (collaborative via Y.Text) ─────────────────
  const [editTitle, setEditTitle] = useState("");

  // ── Read mode editor ───────────────────────────────────────
  const readEditor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions(""),
    content: document?.content || "",
    editable: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-content prose m-5 max-w-none px-2 pb-32 text-[#111111] focus:outline-none dark:prose-invert dark:text-[#E8E8E7] prose-strong:text-[#111111] dark:prose-strong:text-[#E8E8E7]",
      },
    },
  });

  // Update read editor when document content changes
  useEffect(() => {
    if (readEditor && document?.id && mode === "read") {
      readEditor.commands.setContent(document.content || "");
    }
  }, [readEditor, document?.content, document?.id, mode]);

  // ── Edit mode editor (with Yjs Collaboration) ─────────────
  const editEditorRef = useRef<ReturnType<typeof useEditor> | null>(null);
  const [, setEditorUpdateTick] = useState(0);

  // Create collaborative editor when entering edit mode
  const createCollaborativeEditor = useCallback((ydoc: Y.Doc) => {
    // We can't use useEditor conditionally, so we'll use the Editor class directly
    const editor = new Editor({
      extensions: getCollaborativeEditorExtensions(
        "Nhập nội dung vào đây...",
        ydoc,
      ),
      editable: true,
      editorProps: {
        attributes: {
          class:
            "tiptap-content prose m-5 focus:outline-none max-w-none px-2 pb-32",
        },
      },
    });

    const tick = () => setEditorUpdateTick((t) => t + 1);
    editor.on("update", tick);
    editor.on("selectionUpdate", tick);

    editEditorRef.current = editor;
    setEditorUpdateTick((t) => t + 1);
    return editor;
  }, []);

  // ── Enter Edit Mode ────────────────────────────────────────
  const enterEditMode = useCallback(() => {
    if (!selectedDocumentId || !document) return;

    // Create a new Y.Doc
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    pendingUpdatesRef.current = [];

    // Local title initialization — delayed until socket syncs to avoid CRDT
    // duplication, but pre-populate the input with the known value immediately.
    const yTitle = ydoc.getText("title");
    setEditTitle(document.title || "");

    // Create the collaborative editor immediately
    const editor = createCollaborativeEditor(ydoc);

    // Connect socket
    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    const joinAndSync = () => {
      // Guard: if the user exited edit mode before the socket connected, bail.
      if (ydocRef.current !== ydoc) return;

      realtimeSocketClient.pageManager.join(
        socket,
        selectedDocumentId,
        (response) => {
          if (!response.ok) return;

          // Apply server Yjs state if available
          if (response.yjsState && response.yjsState.length > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(response.yjsState), "remote");
          }

          // Set title from Y.Text or server response if empty
          if (yTitle.length === 0 && (response.title || document?.title)) {
            yTitle.insert(0, response.title || document?.title || "");
          }

          // If Y.Doc content is empty, initialize from HTML content
          if (editor.isEmpty && (response.content || document?.content)) {
            const contentToSet = response.content || document?.content;
            if (contentToSet) {
              editor.commands.setContent(contentToSet);
            }
          }
        },
      );
    };

    if (socket.connected) {
      joinAndSync();
    } else {
      socket.once(SOCKET_EVENTS.CONNECT, joinAndSync);
    }

    // Listen for Yjs updates from other clients
    const handleRemoteYjsUpdate = (data: {
      pageId: string;
      update: number[];
    }) => {
      if (data.pageId === selectedDocumentId && ydocRef.current) {
        Y.applyUpdate(ydocRef.current, new Uint8Array(data.update), "remote");
      }
    };
    if (remoteUpdateListenerRef.current) {
      socket.off(
        SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED,
        remoteUpdateListenerRef.current,
      );
    }
    remoteUpdateListenerRef.current = handleRemoteYjsUpdate;
    socket.on(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, handleRemoteYjsUpdate);

    // Send local Yjs updates to server — store ref so exitEditMode can remove it
    const handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return;

      const currentSocket = realtimeSocketClient.getSocket();
      if (currentSocket && currentSocket.connected) {
        realtimeSocketClient.pageManager.yjsUpdate(currentSocket, update);
      } else {
        pendingUpdatesRef.current.push(update);
      }
    };
    localUpdateListenerRef.current = handleLocalUpdate;
    ydoc.on("update", handleLocalUpdate);

    // Observe Y.Text title changes
    const handleTitleChange = () => {
      const newT = yTitle.toString();
      setEditTitle((prev) => (prev !== newT ? newT : prev));
    };
    yTitle.observe(handleTitleChange);

    setMode("edit");
  }, [selectedDocumentId, document, createCollaborativeEditor]);

  // ── Exit Edit Mode ─────────────────────────────────────────
  const exitEditMode = useCallback(() => {
    // Explicitly remove the local-update listener before destroying the doc so
    // there's no implicit dependency on ydoc.destroy() cleaning it up.
    if (ydocRef.current && localUpdateListenerRef.current) {
      ydocRef.current.off("update", localUpdateListenerRef.current);
      localUpdateListenerRef.current = null;
    }

    // Cleanup Yjs
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    // Cleanup edit editor
    if (editEditorRef.current) {
      editEditorRef.current.destroy();
      editEditorRef.current = null;
    }

    // Clear draft content sync timer
    if (draftContentTimerRef.current) {
      clearInterval(draftContentTimerRef.current);
      draftContentTimerRef.current = null;
    }

    // Leave page room and remove socket listeners
    const socket = realtimeSocketClient.getSocket();
    if (socket) {
      if (remoteUpdateListenerRef.current) {
        socket.off(
          SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED,
          remoteUpdateListenerRef.current,
        );
        remoteUpdateListenerRef.current = null;
      }
      realtimeSocketClient.pageManager.leave(socket);
    }

    pendingUpdatesRef.current = [];
    setMode("read");
  }, []);

  // ── Handle reconnect — proper state vector sync ───────────────
  useEffect(() => {
    const unsubReconnect = realtimeSocketClient.onReconnect(() => {
      if (mode !== "edit" || !ydocRef.current) return;

      const socket = realtimeSocketClient.getSocket();
      if (!socket || !socket.connected) return;

      // On reconnect, we sync state vectors to ensure no updates are lost
      // (which happens if we only rely on pendingUpdatesRef during silent network drops)
      if (selectedDocumentId) {
        realtimeSocketClient.pageManager.sync(socket, (response) => {
          if (!response.ok || !ydocRef.current) return;

          // 1. Apply server's missing updates to our doc
          if (response.yjsState && response.yjsState.length > 0) {
            Y.applyUpdate(
              ydocRef.current,
              new Uint8Array(response.yjsState),
              "remote",
            );
          }

          // 2. Force sync our FULL state to the server.
          // This guarantees that any offline edits (even those lost during TCP half-open state)
          // are fully merged into the server's Y.Doc, preventing any "overwrite" bugs.
          const fullState = Y.encodeStateAsUpdate(ydocRef.current);
          realtimeSocketClient.pageManager.yjsUpdate(socket, fullState);

          pendingUpdatesRef.current = [];
        });
      }
    });

    return () => unsubReconnect();
  }, [mode, selectedDocumentId]);

  // ── Connection status subscription ─────────────────────────
  useEffect(() => {
    const unsubStatus = realtimeSocketClient.subscribeStatus((snapshot) => {
      setConnectionStatus(snapshot.status);
    });
    return () => unsubStatus();
  }, []);

  // ── beforeunload warning ───────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        mode === "edit" &&
        (connectionStatus === "disconnected" || connectionStatus === "error") &&
        pendingUpdatesRef.current.length > 0
      ) {
        e.preventDefault();
        e.returnValue =
          "Bạn có thay đổi chưa được đồng bộ. Nếu rời trang, các thay đổi này có thể bị mất.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [mode, connectionStatus]);

  const handleTitleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!ydocRef.current) return;
      const yTitle = ydocRef.current.getText("title");
      ydocRef.current.transact(() => {
        applyYTextDiff(yTitle, e.target.value);
      });
    },
    [],
  );

  // ── Update (publish) handler ───────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!document || !selectedDocumentId) return;

    const editor = editEditorRef.current;
    if (!editor) return;

    setIsPublishing(true);
    try {
      const html = sanitizeEditorHtml(editor.getHTML());
      const title =
        ydocRef.current?.getText("title").toString() || document.title;

      // Step 1: PATCH content and title to main page
      await pagesService.updatePage(selectedDocumentId, {
        title,
        content: html,
      });

      // Step 2: POST publish
      await pagesService.publishPage(selectedDocumentId);

      // Update local store
      updateDocument(selectedDocumentId, { title, content: html });

      toast.success("Cập nhật thành công");
    } catch (error) {
      console.error("Failed to publish:", error);
      toast.error("Cập nhật thất bại");
    } finally {
      setIsPublishing(false);
    }
  }, [document, selectedDocumentId, updateDocument]);

  // ── Cleanup on unmount or document change ──────────────────
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    return () => {
      if (modeRef.current === "edit") {
        exitEditMode();
      }
    };
  }, [selectedDocumentId, exitEditMode]);

  const handleToggleMode = useCallback(() => {
    if (mode === "read") {
      enterEditMode();
    } else {
      exitEditMode();
    }
  }, [mode, enterEditMode, exitEditMode]);

  if (!document) return null;

  const activeEditor = mode === "edit" ? editEditorRef.current : readEditor;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden">
      <EditorHeader
        doc={document}
        mode={mode}
        canEdit={canEditPage}
        connectionStatus={connectionStatus}
        isPublishing={isPublishing}
        onToggleMode={handleToggleMode}
        onPublish={handlePublish}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-950">
        {/* Toolbar — only in Edit mode */}
        {mode === "edit" && (
          <div className="sticky top-0 z-20">
            <EditorToolbar editor={activeEditor} />
          </div>
        )}

        <div className="mx-auto w-full max-w-[1200px] px-6 py-16 lg:px-10">
          {/* Title */}
          <div className="mb-10">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
              Document Title
            </p>
            <div className="rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-5 py-4 transition focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6]">
              <input
                type="text"
                value={mode === "edit" ? editTitle : document.title}
                onChange={mode === "edit" ? handleTitleInput : undefined}
                readOnly={mode === "read"}
                className="w-full text-4xl font-extrabold border-none outline-none focus:ring-0 bg-transparent text-[#172B4D] dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all tracking-tight leading-tight"
                placeholder="Nhập tiêu đề tài liệu..."
              />
            </div>
          </div>

          {/* Content */}
          <div className="pb-40">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
              Document Content
            </p>
            <div className="min-h-[600px] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-4 py-3 transition focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6]">
              <div className="dark:prose-invert">
                <EditorContent editor={activeEditor} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
