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

const DRAFT_CONTENT_SYNC_DELAY = 5000; // Sync derived HTML every 5 seconds

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
  const remoteUpdateListenerRef = useRef<any>(null);

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
          "tiptap-content prose m-5 focus:outline-none max-w-none px-2 pb-32",
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

    // Local title initialization - we delay this until socket syncs
    // to avoid CRDT duplication.
    const yTitle = ydoc.getText("title");
    setEditTitle(document.title || "");

    // Create the collaborative editor immediately
    const editor = createCollaborativeEditor(ydoc);

    // Connect socket
    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    const joinAndSync = () => {
      realtimeSocketClient.pageManager.join(
        socket,
        selectedDocumentId,
        (response) => {
          if (!response.ok) return;

          // Apply server Yjs state if available
          if (response.yjsState && response.yjsState.length > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(response.yjsState));
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
        Y.applyUpdate(ydocRef.current, new Uint8Array(data.update));
      }
    };
    // Remove old listener if exists
    if (remoteUpdateListenerRef.current) {
      socket.off(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, remoteUpdateListenerRef.current);
    }
    remoteUpdateListenerRef.current = handleRemoteYjsUpdate;
    socket.on(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, handleRemoteYjsUpdate);

    // Send local Yjs updates to server
    const handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
      // Skip updates originated from remote (to avoid echo)
      if (origin === "remote") return;

      const currentSocket = realtimeSocketClient.getSocket();
      if (currentSocket && currentSocket.connected) {
        realtimeSocketClient.pageManager.yjsUpdate(currentSocket, update);
      } else {
        // Store in pending queue for later sync
        pendingUpdatesRef.current.push(update);
      }
    };
    ydoc.on("update", handleLocalUpdate);

    // Observe Y.Text title changes
    const handleTitleChange = () => {
      const newT = yTitle.toString();
      setEditTitle((prev) => (prev !== newT ? newT : prev));
    };
    yTitle.observe(handleTitleChange);

    // Periodically sync derived HTML content to server for search/fallback
    draftContentTimerRef.current = setInterval(() => {
      const currentSocket = realtimeSocketClient.getSocket();
      const editor = editEditorRef.current;
      if (currentSocket?.connected && editor && ydocRef.current) {
        const html = sanitizeEditorHtml(editor.getHTML());
        const title = ydocRef.current.getText("title").toString();
        realtimeSocketClient.pageManager.sendDraftContent(
          currentSocket,
          html,
          title,
        );
      }
    }, DRAFT_CONTENT_SYNC_DELAY);

    setMode("edit");
  }, [selectedDocumentId, document, createCollaborativeEditor]);

  // ── Exit Edit Mode ─────────────────────────────────────────
  const exitEditMode = useCallback(() => {
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

    // Leave page room
    const socket = realtimeSocketClient.getSocket();
    if (socket) {
      if (remoteUpdateListenerRef.current) {
        socket.off(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, remoteUpdateListenerRef.current);
        remoteUpdateListenerRef.current = null;
      }
      realtimeSocketClient.pageManager.leave(socket);
    }

    pendingUpdatesRef.current = [];
    setMode("read");
  }, []);

  // ── Handle reconnect — drain pending updates ───────────────
  useEffect(() => {
    const unsubReconnect = realtimeSocketClient.onReconnect(() => {
      if (mode !== "edit" || !ydocRef.current) return;

      const socket = realtimeSocketClient.getSocket();
      if (!socket || !socket.connected) return;

      // Drain pending updates
      const pending = pendingUpdatesRef.current;
      if (pending.length > 0) {
        for (const update of pending) {
          realtimeSocketClient.pageManager.yjsUpdate(socket, update);
        }
        pendingUpdatesRef.current = [];
      }

      // Re-join the page room to get latest server state
      if (selectedDocumentId) {
        realtimeSocketClient.pageManager.join(
          socket,
          selectedDocumentId,
          (response) => {
            if (
              response.ok &&
              response.yjsState &&
              response.yjsState.length > 0 &&
              ydocRef.current
            ) {
              Y.applyUpdate(ydocRef.current, new Uint8Array(response.yjsState));
            }
          },
        );
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

  // ── Handle title change (collaborative via Y.Text) ─────────
  const handleTitleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      if (!ydocRef.current) return;

      const yTitle = ydocRef.current.getText("title");
      ydocRef.current.transact(() => {
        yTitle.delete(0, yTitle.length);
        yTitle.insert(0, newTitle);
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
        onToggleMode={() => {
          if (mode === "read") {
            enterEditMode();
          } else {
            exitEditMode();
          }
        }}
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tiêu đề tài liệu
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/50 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-900/40">
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Nội dung tài liệu
            </p>
            <div className="min-h-[600px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900/50 dark:focus-within:border-indigo-500 dark:focus-within:ring-indigo-900/40">
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
