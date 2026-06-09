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

export type EditorMode = "read" | "edit";

export default function TiptapEditor() {
  const { documents, selectedDocumentId, updateDocument } = useDocsStore();
  const document = documents.find((d) => d.id === selectedDocumentId);
  const { hasPermission } = useWorkspacePermission(document?.workspaceId ?? "");
  const canEditPage = hasPermission(WORKSPACE_PERMISSIONS.PAGE_EDIT);

  // ── Mode ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<EditorMode>("read");
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Connection status ──────────────────────────────────────────
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatusSnapshot["status"]>("idle");

  // ── Offline buffer — pending Yjs updates not yet sent ─────────
  // Only survives within the same browser session (RAM).
  // On page refresh these are lost → we show a beforeunload warning.
  const pendingUpdatesRef = useRef<Uint8Array[]>([]);

  // ── Yjs ────────────────────────────────────────────────────────
  const ydocRef = useRef<Y.Doc | null>(null);

  // ── Title (collaborative) ──────────────────────────────────────
  const [editTitle, setEditTitle] = useState("");

  // Stored so we can unobserve on exit without holding a stale closure
  const titleObserverRef = useRef<(() => void) | null>(null);

  // ── Remote update listener ref (for proper cleanup) ───────────
  const remoteListenerRef = useRef<
    ((data: { pageId: string; update: number[] }) => void) | null
  >(null);

  // ── Read-mode editor (always mounted, never editable) ─────────
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

  useEffect(() => {
    if (readEditor && document?.id && mode === "read") {
      readEditor.commands.setContent(document.content || "");
    }
  }, [readEditor, document?.content, document?.id, mode]);

  // ── Edit-mode editor (created imperatively, lives in a ref) ───
  const editEditorRef = useRef<Editor | null>(null);
  const [, tickEditEditor] = useState(0);

  const createCollaborativeEditor = useCallback((ydoc: Y.Doc): Editor => {
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

    editor.on("update", () => tickEditEditor((t) => t + 1));
    editor.on("selectionUpdate", () => tickEditEditor((t) => t + 1));

    editEditorRef.current = editor;
    tickEditEditor((t) => t + 1);
    return editor;
  }, []);

  // ── Enter edit mode ────────────────────────────────────────────
  const enterEditMode = useCallback(() => {
    if (!selectedDocumentId || !document) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    pendingUpdatesRef.current = [];

    // Create editor immediately so it renders while the socket connects
    const editor = createCollaborativeEditor(ydoc);

    // ── Apply server state once socket ACKs the join ─────────────
    const applyServerState = (response: {
      ok: boolean;
      yjsState?: number[];
      title?: string;
    }) => {
      if (!response.ok) return;

      // 1. Apply full Yjs snapshot — this initialises content & title Y.Texts
      if (response.yjsState?.length) {
        Y.applyUpdate(ydoc, new Uint8Array(response.yjsState), "remote");
      }

      // 2. If title Y.Text is still empty after snapshot, seed from server/store
      const yTitle = ydoc.getText("title");
      if (yTitle.length === 0) {
        const seed = response.title || document?.title;
        if (seed) {
          ydoc.transact(() => yTitle.insert(0, seed), "remote");
        }
      }

      // 3. Sync local title state once — observer handles subsequent changes
      setEditTitle(yTitle.toString());

      // 4. If Collaboration extension left content empty (no XmlFragment in
      //    snapshot), fall back to the published HTML stored in the store.
      if (editor.isEmpty && document?.content) {
        editor.commands.setContent(document.content);
      }
    };

    // ── Yjs title observer ───────────────────────────────────────
    const yTitle = ydoc.getText("title");
    const handleTitleChange = () => {
      const next = yTitle.toString();
      setEditTitle((prev) => (prev !== next ? next : prev));
    };
    yTitle.observe(handleTitleChange);
    titleObserverRef.current = () => yTitle.unobserve(handleTitleChange);

    // ── Yjs local-update handler — send to server or buffer ──────
    const handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return; // skip echoes

      const socket = realtimeSocketClient.getSocket();
      if (socket?.connected) {
        realtimeSocketClient.pageManager.yjsUpdate(socket, update);
      } else {
        pendingUpdatesRef.current.push(update);
      }
    };
    ydoc.on("update", handleLocalUpdate);

    // ── Remote Yjs update handler ────────────────────────────────
    const handleRemoteUpdate = (data: { pageId: string; update: number[] }) => {
      if (data.pageId !== selectedDocumentId || !ydocRef.current) return;
      Y.applyUpdate(ydocRef.current, new Uint8Array(data.update), "remote");
    };

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    // Clean up any leftover listener from a previous session
    if (remoteListenerRef.current) {
      socket.off(
        SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED,
        remoteListenerRef.current,
      );
    }
    remoteListenerRef.current = handleRemoteUpdate;
    socket.on(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, handleRemoteUpdate);

    // ── Join the page room ───────────────────────────────────────
    const joinRoom = () => {
      realtimeSocketClient.pageManager.join(
        socket,
        selectedDocumentId,
        applyServerState,
      );
    };

    if (socket.connected) {
      joinRoom();
    } else {
      // socket.once so we don't duplicate if enterEditMode is called again
      socket.once(SOCKET_EVENTS.CONNECT, joinRoom);
    }

    setMode("edit");
  }, [selectedDocumentId, document, createCollaborativeEditor]);

  // ── Exit edit mode ─────────────────────────────────────────────
  const exitEditMode = useCallback(() => {
    // 1. Unobserve Y.Text title before destroying doc
    if (titleObserverRef.current) {
      titleObserverRef.current();
      titleObserverRef.current = null;
    }

    // 2. Destroy Y.Doc (also fires final update observers — harmless)
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    // 3. Destroy edit-mode editor
    if (editEditorRef.current) {
      editEditorRef.current.destroy();
      editEditorRef.current = null;
    }

    // 4. Leave socket room & remove remote listener
    const socket = realtimeSocketClient.getSocket();
    if (socket) {
      if (remoteListenerRef.current) {
        socket.off(
          SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED,
          remoteListenerRef.current,
        );
        remoteListenerRef.current = null;
      }
      realtimeSocketClient.pageManager.leave(socket);
    }

    pendingUpdatesRef.current = [];
    setMode("read");
  }, []);

  // ── Reconnect: state-vector merge ─────────────────────────────
  useEffect(() => {
    const unsubReconnect = realtimeSocketClient.onReconnect(() => {
      if (mode !== "edit" || !ydocRef.current) return;

      const socket = realtimeSocketClient.getSocket();
      if (!socket?.connected) return;

      // Rejoin the room and receive the server's full state.
      // Then push our full local state so any offline edits are merged.
      realtimeSocketClient.pageManager.rejoin(socket, (response) => {
        if (!response.ok || !ydocRef.current) return;

        // Apply whatever the server has that we are missing
        if (response.yjsState?.length) {
          Y.applyUpdate(
            ydocRef.current,
            new Uint8Array(response.yjsState),
            "remote",
          );
        }

        // Push our full state to the server — this merges any offline edits
        // even when TCP silently dropped incremental updates mid-session.
        const fullState = Y.encodeStateAsUpdate(ydocRef.current);
        realtimeSocketClient.pageManager.yjsUpdate(socket, fullState);

        pendingUpdatesRef.current = [];
      });
    });

    return () => unsubReconnect();
  }, [mode]);

  // ── Connection status subscription ────────────────────────────
  useEffect(() => {
    const unsub = realtimeSocketClient.subscribeStatus((snap) => {
      setConnectionStatus(snap.status);
    });
    return () => unsub();
  }, []);

  // ── beforeunload warning ───────────────────────────────────────
  // Two separate concerns, two separate warnings:
  //   A) offline + unsynced updates → data will be lost
  //   B) online but not yet published → draft saved, main page not updated
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (mode !== "edit") return;

      const offline =
        connectionStatus === "disconnected" || connectionStatus === "error";
      const hasUnsynced = pendingUpdatesRef.current.length > 0;

      if (offline && hasUnsynced) {
        e.preventDefault();
        e.returnValue =
          "Bạn có thay đổi chưa được đồng bộ. Nếu rời trang, các thay đổi này có thể bị mất.";
        return;
      }

      // Even when online: warn that main page hasn't been published yet.
      // This is softer — user may intentionally leave without publishing.
      e.preventDefault();
      e.returnValue =
        "Bạn đang ở chế độ chỉnh sửa. Nhấn 'Cập nhật' để lưu bản chính trước khi rời trang.";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [mode, connectionStatus]);

  // ── Title input (CRDT diff) ────────────────────────────────────
  const handleTitleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      const ydoc = ydocRef.current;
      if (!ydoc) return;

      const yTitle = ydoc.getText("title");
      ydoc.transact(() => {
        const curr = yTitle.toString();
        if (curr === next) return;

        let pre = 0;
        while (
          pre < curr.length &&
          pre < next.length &&
          curr[pre] === next[pre]
        )
          pre++;

        let suf = 0;
        while (
          suf < curr.length - pre &&
          suf < next.length - pre &&
          curr[curr.length - 1 - suf] === next[next.length - 1 - suf]
        )
          suf++;

        const del = curr.length - pre - suf;
        const ins = next.slice(pre, next.length - suf || undefined);
        if (del > 0) yTitle.delete(pre, del);
        if (ins) yTitle.insert(pre, ins);
      });
    },
    [],
  );

  // ── Publish ("Cập nhật") ───────────────────────────────────────
  // Delegates to the server via socket so the server Y.Doc is always the
  // single source of truth.  Falls back to a direct HTTP PATCH only if
  // the socket is offline.
  const handlePublish = useCallback(async () => {
    if (!document || !selectedDocumentId) return;

    setIsPublishing(true);
    try {
      const socket = realtimeSocketClient.getSocket();

      if (socket?.connected) {
        // Happy path: ask the server to flush draft → Page
        await new Promise<void>((resolve, reject) => {
          realtimeSocketClient.pageManager.publish(socket, (ok) => {
            if (ok) {
              // Sync the store so the read-mode editor reflects the latest title
              const title =
                ydocRef.current?.getText("title").toString() || document.title;
              const html = sanitizeEditorHtml(
                editEditorRef.current?.getHTML() ?? "",
              );
              updateDocument(selectedDocumentId, { title, content: html });
              resolve();
            } else {
              reject(new Error("server_publish_failed"));
            }
          });
        });
      } else {
        // Offline fallback: the user explicitly hit "Cập nhật" even though
        // the socket is down.  We cannot guarantee the server Y.Doc has all
        // our edits, so we surface a clear error rather than silently writing
        // a potentially stale snapshot.
        throw new Error("offline");
      }

      toast.success("Cập nhật thành công");
    } catch (error) {
      const msg = (error as Error).message;
      if (msg === "offline") {
        toast.error("Mất kết nối — vui lòng kết nối lại rồi thử lại.");
      } else {
        toast.error("Cập nhật thất bại");
      }
      console.error("handlePublish:", error);
    } finally {
      setIsPublishing(false);
    }
  }, [document, selectedDocumentId, updateDocument]);

  // ── Cleanup on unmount / document switch ──────────────────────
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
        onToggleMode={() =>
          mode === "read" ? enterEditMode() : exitEditMode()
        }
        onPublish={handlePublish}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-950">
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
