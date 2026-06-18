import { io, Socket } from "socket.io-client";

import {
  getSocketAuthPayload,
  isUnauthorizedError,
  refreshSocketAuth,
} from "./socket.auth";
import { SOCKET_EVENTS } from "./socket.events";
import type {
  RealtimeConnectionStatus,
  RealtimeStatusSnapshot,
} from "./socket.types";
import { WorkspaceRoomManager } from "./socket.workspace";
import { PageRoomManager } from "./socket.page";

const getSocketUrl = (): string => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5512";

  try {
    return `${new URL(base).origin}/realtime`;
  } catch {
    return "http://localhost:5512/realtime";
  }
};

class RealtimeSocketClient {
  private socket?: Socket;
  private status: RealtimeConnectionStatus = "idle";
  private lastError?: string;
  private hasConnectedBefore = false;
  private readonly workspaceManager = new WorkspaceRoomManager();
  public readonly pageManager = new PageRoomManager();
  private readonly statusListeners = new Set<
    (snapshot: RealtimeStatusSnapshot) => void
  >();
  private readonly reconnectCallbacks = new Set<() => void>();

  getSocket(): Socket | undefined {
    return this.socket;
  }

  connect(): Socket | undefined {
    if (typeof window === "undefined") return undefined;

    if (this.socket) {
      this.applyLatestAuth();
      if (!this.socket.connected && !this.socket.active) {
        this.setStatus("connecting");
        this.socket.connect();
      }
      return this.socket;
    }

    this.socket = io(getSocketUrl(), {
      transports: ["websocket"],
      withCredentials: true,
      auth: getSocketAuthPayload(),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
      autoConnect: false,
    });

    this.registerLifecycleHandlers(this.socket);
    this.setStatus("connecting");
    this.socket.connect();

    return this.socket;
  }

  disconnect(): void {
    if (!this.socket) return;

    this.workspaceManager.reset();
    this.pageManager.reset();
    this.socket.disconnect();
    this.socket.removeAllListeners();
    this.socket.io.removeAllListeners();
    this.socket = undefined;
    this.hasConnectedBefore = false;
    this.setStatus("idle");
  }

  switchWorkspace(workspaceId?: string): void {
    const socket = this.connect();
    if (!socket) return;

    this.workspaceManager.switch(socket, workspaceId);
    this.emitStatus();
  }

  leaveCurrentWorkspace(): void {
    if (!this.socket) return;

    this.workspaceManager.leave(this.socket);
    this.emitStatus();
  }

  onReconnect(callback: () => void): () => void {
    this.reconnectCallbacks.add(callback);
    return () => this.reconnectCallbacks.delete(callback);
  }

  subscribeStatus(
    callback: (snapshot: RealtimeStatusSnapshot) => void,
  ): () => void {
    this.statusListeners.add(callback);
    callback(this.getStatusSnapshot());

    return () => this.statusListeners.delete(callback);
  }

  getStatusSnapshot(): RealtimeStatusSnapshot {
    return {
      status: this.status,
      socketId: this.socket?.id,
      currentWorkspaceId: this.workspaceManager.current,
      lastError: this.lastError,
    };
  }

  private registerLifecycleHandlers(socket: Socket): void {
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.lastError = undefined;
      this.setStatus("connected");
      this.workspaceManager.rejoin(socket);
      this.pageManager.rejoin(socket);

      if (this.hasConnectedBefore) {
        this.reconnectCallbacks.forEach((callback) => callback());
      }
      this.hasConnectedBefore = true;
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      this.lastError = reason;
      this.setStatus("disconnected");

      if (reason === "io server disconnect") {
        // The server disconnected us, likely because the token expired.
        // Try to refresh the token and reconnect.
        void refreshSocketAuth()
          .then(() => {
            this.applyLatestAuth();
            if (!socket.connected) {
              this.setStatus("connecting");
              socket.connect();
            }
          })
          .catch(() => {
            this.disconnect();
          });
      }
    });

    socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      this.lastError = error.message;
      this.setStatus("error");

      if (!isUnauthorizedError(error)) return;

      void refreshSocketAuth()
        .then(() => {
          this.applyLatestAuth();
          if (!socket.connected) {
            this.setStatus("connecting");
            socket.connect();
          }
        })
        .catch(() => socket.disconnect());
    });

    socket.io.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, () => {
      this.applyLatestAuth();
      this.setStatus("connecting");
    });
  }

  private applyLatestAuth(): void {
    if (!this.socket) return;
    this.socket.auth = getSocketAuthPayload();
  }

  private setStatus(status: RealtimeConnectionStatus): void {
    this.status = status;
    this.emitStatus();
  }

  private emitStatus(): void {
    const snapshot = this.getStatusSnapshot();
    this.statusListeners.forEach((listener) => listener(snapshot));
  }
}

export const realtimeSocketClient = new RealtimeSocketClient();
