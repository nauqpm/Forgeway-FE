// Hook managing collaborative state and logic of document page,
// sets up Yjs and awareness connection to sync content and user awareness across clients,
// handles entering/exiting edit mode, syncing offline updates, and responding to collaboration events.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Yjs from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import { Editor } from "@tiptap/react";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";
import { editorStorageService } from "@/modules/docs/services/editorStorage.service";
import { useAuthStore } from "@/modules/auth/shared/stores/authStore";
import { toast } from "react-hot-toast";

interface UseCollaborativePageProps {
  selectedDocumentId: string | undefined;
  initialTitle: string;
  initialContent: string;
  mode: "read" | "edit";
  setMode: (mode: "read" | "edit") => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createCollaborativeEditor: (ydoc: Yjs.Doc, awareness: any) => Editor;
  destroyCollaborativeEditor: () => void;
}

interface EnterEditModeOptions {
  documentId?: string;
  initialTitle?: string;
  initialContent?: string;
}

export function useCollaborativePage({
  selectedDocumentId,
  initialTitle,
  initialContent,
  mode,
  setMode,
  createCollaborativeEditor,
  destroyCollaborativeEditor,
}: UseCollaborativePageProps) {
  const ydocRef = useRef<Yjs.Doc | null>(null);
  const activeDocumentIdRef = useRef<string | null>(null);
  const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const isSyncingRef = useRef(false);
  const [hasPendingOffline, setHasPendingOffline] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteUpdateListenerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteAwarenessListenerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteVersionRestoredListenerRef = useRef<any>(null);

  // ── Sync offline updates to server ────────────────────────
  const syncOfflineUpdates = useCallback(async () => {
    const documentId = activeDocumentIdRef.current ?? selectedDocumentId;
    if (!documentId || isSyncingRef.current) return;
    const socket = realtimeSocketClient.getSocket();
    if (!socket || !socket.connected) return;

    isSyncingRef.current = true;
    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage({ type: "SYNC_START", pageId: documentId });
    }

    try {
      const pending = await editorStorageService.getPendingUpdates(documentId);
      if (pending.length > 0) {
        for (const item of pending) {
          await new Promise<void>((resolve) => {
            realtimeSocketClient.pageManager.yjsUpdate(socket, item.update, item.id, (ok) => {
              if (ok) {
                editorStorageService.removeUpdate(item.id).then(() => {
                  if (syncChannelRef.current) {
                    syncChannelRef.current.postMessage({
                      type: "ACK_RECEIVED",
                      updateId: item.id,
                      pageId: documentId,
                    });
                  }
                });
              }
              resolve();
            });
          });
        }
      }

      const remaining = await editorStorageService.getPendingUpdates(documentId);
      setHasPendingOffline(remaining.length > 0);
    } catch (err) {
      console.error("Failed to sync offline updates:", err);
    } finally {
      isSyncingRef.current = false;
      if (syncChannelRef.current) {
        syncChannelRef.current.postMessage({ type: "SYNC_COMPLETE", pageId: documentId });
      }
    }
  }, [selectedDocumentId]);

  // ── BroadcastChannel lifecycle for multi-tab sync ─────────
  useEffect(() => {
    if (typeof window === "undefined" || mode !== "edit" || !selectedDocumentId) {
      return;
    }

    const channel = new BroadcastChannel(`tiptap-sync-${selectedDocumentId}`);
    syncChannelRef.current = channel;

    channel.onmessage = async (event) => {
      const { type, updateId, pageId } = event.data;
      if (pageId !== selectedDocumentId) return;

      if (type === "ACK_RECEIVED" && updateId) {
        await editorStorageService.removeUpdate(updateId);
        const pending = await editorStorageService.getPendingUpdates(selectedDocumentId);
        setHasPendingOffline(pending.length > 0);
      } else if (type === "SYNC_START") {
        isSyncingRef.current = true;
      } else if (type === "SYNC_COMPLETE") {
        isSyncingRef.current = false;
      }
    };

    void editorStorageService.getPendingUpdates(selectedDocumentId).then((pending) => {
      setHasPendingOffline(pending.length > 0);
    });

    return () => {
      channel.close();
      syncChannelRef.current = null;
    };
  }, [selectedDocumentId, mode]);

  // ── Enter Edit Mode ────────────────────────────────────────
  const enterEditMode = useCallback((options?: EnterEditModeOptions) => {
    const activeDocumentId = options?.documentId ?? selectedDocumentId;
    if (!activeDocumentId) return;
    activeDocumentIdRef.current = activeDocumentId;
    const activeInitialTitle = options?.initialTitle ?? initialTitle;
    const activeInitialContent = options?.initialContent ?? initialContent;

    const ydoc = new Yjs.Doc();
    ydocRef.current = ydoc;

    const awareness = new awarenessProtocol.Awareness(ydoc);
    awarenessRef.current = awareness;

    const user = useAuthStore.getState().user;
    const getRandomColor = () => {
      const colors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
      return colors[Math.floor(Math.random() * colors.length)];
    };
    awareness.setLocalStateField("user", {
      name: user?.fullName || user?.email || "Anonymous",
      color: getRandomColor(),
    });

    const editor = createCollaborativeEditor(ydoc, awareness);

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    const joinAndSync = () => {
      realtimeSocketClient.pageManager.join(
        socket,
        activeDocumentId,
        (response) => {
          if (!response.ok) return;
          if (!editor || editor.isDestroyed) return;

          if (response.yjsState && response.yjsState.length > 0) {
            Yjs.applyUpdate(ydoc, new Uint8Array(response.yjsState), "remote");
          }

          if (yTitle.length === 0 && (response.title || activeInitialTitle)) {
            yTitle.insert(0, response.title || activeInitialTitle);
          }

          if (editor.isEmpty && (response.content || activeInitialContent)) {
            const contentToSet = response.content || activeInitialContent;
            if (contentToSet) {
              editor
                .chain()
                .setMeta("addToHistory", false)
                .setContent(contentToSet, { emitUpdate: false })
                .run();
            }
          }

          void syncOfflineUpdates();

          // Share local awareness state once joined
          const localUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, [
            awareness.clientID,
          ]);
          realtimeSocketClient.pageManager.awarenessUpdate(socket, localUpdate);
        },
      );
    };

    const yTitle = ydoc.getText("title");

    if (socket.connected) {
      joinAndSync();
    } else {
      socket.once(SOCKET_EVENTS.CONNECT, joinAndSync);
    }

    const handleRemoteYjsUpdate = (data: { pageId: string; update: number[] }) => {
      if (data.pageId === activeDocumentId && ydocRef.current) {
        Yjs.applyUpdate(ydocRef.current, new Uint8Array(data.update), "remote");
      }
    };

    if (remoteUpdateListenerRef.current) {
      socket.off(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, remoteUpdateListenerRef.current);
    }
    remoteUpdateListenerRef.current = handleRemoteYjsUpdate;
    socket.on(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, handleRemoteYjsUpdate);

    // Awareness local update handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const handleLocalAwarenessUpdate = ({ added: _added, updated: _updated, removed: _removed }: any) => {
      const currentSocket = realtimeSocketClient.getSocket();
      if (currentSocket && currentSocket.connected) {
        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, [
          awareness.clientID,
        ]);
        realtimeSocketClient.pageManager.awarenessUpdate(currentSocket, update);
      }
    };
    awareness.on("update", handleLocalAwarenessUpdate);

    // Awareness remote update handler
    const handleRemoteAwarenessUpdate = (data: { pageId: string; update: number[] }) => {
      if (data.pageId === activeDocumentId && awarenessRef.current) {
        awarenessProtocol.applyAwarenessUpdate(
          awarenessRef.current,
          new Uint8Array(data.update),
          "remote"
        );
      }
    };

    if (remoteAwarenessListenerRef.current) {
      socket.off(SOCKET_EVENTS.PAGE_AWARENESS_UPDATE_RECEIVED, remoteAwarenessListenerRef.current);
    }
    remoteAwarenessListenerRef.current = handleRemoteAwarenessUpdate;
    socket.on(SOCKET_EVENTS.PAGE_AWARENESS_UPDATE_RECEIVED, handleRemoteAwarenessUpdate);

    // Version restored remote update handler
    const handleRemoteVersionRestored = (data: { pageId: string }) => {
      if (data.pageId === activeDocumentId) {
        toast.success("Document version has been restored by another user. Reloading...", {
          duration: 3000,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };

    if (remoteVersionRestoredListenerRef.current) {
      socket.off(SOCKET_EVENTS.PAGE_VERSION_RESTORED, remoteVersionRestoredListenerRef.current);
    }
    remoteVersionRestoredListenerRef.current = handleRemoteVersionRestored;
    socket.on(SOCKET_EVENTS.PAGE_VERSION_RESTORED, handleRemoteVersionRestored);

    const handleLocalUpdate = async (update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return;

      const updateId = await editorStorageService.saveUpdate(activeDocumentId, update);
      setHasPendingOffline(true);

      const currentSocket = realtimeSocketClient.getSocket();
      if (currentSocket && currentSocket.connected && !isSyncingRef.current) {
        realtimeSocketClient.pageManager.yjsUpdate(currentSocket, update, updateId, (ok) => {
          if (ok) {
            editorStorageService.removeUpdate(updateId).then(() => {
              editorStorageService.getPendingUpdates(activeDocumentId).then((pending) => {
                setHasPendingOffline(pending.length > 0);
              });
            });
            if (syncChannelRef.current) {
              syncChannelRef.current.postMessage({
                type: "ACK_RECEIVED",
                updateId,
                pageId: activeDocumentId,
              });
            }
          }
        });
      }
    };
    ydoc.on("update", handleLocalUpdate);

    setMode("edit");
  }, [
    selectedDocumentId,
    initialTitle,
    initialContent,
    createCollaborativeEditor,
    setMode,
    syncOfflineUpdates,
  ]);

  // ── Exit Edit Mode ─────────────────────────────────────────
  const exitEditMode = useCallback(() => {
    activeDocumentIdRef.current = null;
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    if (awarenessRef.current) {
      awarenessRef.current.destroy();
      awarenessRef.current = null;
    }

    destroyCollaborativeEditor();

    const socket = realtimeSocketClient.getSocket();
    if (socket) {
      if (remoteUpdateListenerRef.current) {
        socket.off(SOCKET_EVENTS.PAGE_YJS_UPDATE_RECEIVED, remoteUpdateListenerRef.current);
        remoteUpdateListenerRef.current = null;
      }
      if (remoteAwarenessListenerRef.current) {
        socket.off(SOCKET_EVENTS.PAGE_AWARENESS_UPDATE_RECEIVED, remoteAwarenessListenerRef.current);
        remoteAwarenessListenerRef.current = null;
      }
      if (remoteVersionRestoredListenerRef.current) {
        socket.off(SOCKET_EVENTS.PAGE_VERSION_RESTORED, remoteVersionRestoredListenerRef.current);
        remoteVersionRestoredListenerRef.current = null;
      }
      realtimeSocketClient.pageManager.leave(socket);
    }

    setMode("read");
  }, [destroyCollaborativeEditor, setMode]);

  // ── Handle reconnect — drain pending updates ───────────────
  useEffect(() => {
    const unsubReconnect = realtimeSocketClient.onReconnect(() => {
      if (mode !== "edit" || !ydocRef.current) return;

      const socket = realtimeSocketClient.getSocket();
      if (!socket || !socket.connected) return;

      void syncOfflineUpdates();

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
              Yjs.applyUpdate(ydocRef.current, new Uint8Array(response.yjsState), "remote");
            }
          },
        );
      }
    });

    return () => unsubReconnect();
  }, [mode, selectedDocumentId, syncOfflineUpdates]);

  return {
    ydoc: ydocRef.current,
    awareness: awarenessRef.current,
    hasPendingOffline,
    enterEditMode,
    exitEditMode,
    syncOfflineUpdates,
  };
}
