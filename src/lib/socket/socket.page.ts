import type { Socket } from 'socket.io-client';

import { SOCKET_EVENTS } from './socket.events';

export class PageRoomManager {
  private currentId?: string;

  get current(): string | undefined {
    return this.currentId;
  }

  join(socket: Socket, newPageId: string, onJoinSuccess?: (draft?: string) => void): void {
    if (this.currentId === newPageId) {
      return;
    }

    if (this.currentId && socket.connected) {
      socket.emit(SOCKET_EVENTS.PAGE_LEAVE, {
        pageId: this.currentId,
      });
    }

    this.currentId = newPageId;
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.PAGE_JOIN, {
        pageId: newPageId,
      }, (response: { ok: boolean; draft?: string }) => {
        // Optional callback to handle initial draft content
        if (response.ok && onJoinSuccess) {
          onJoinSuccess(response.draft);
        }
      });
    }
  }

  rejoin(socket: Socket): void {
    if (!this.currentId) return;

    socket.emit(SOCKET_EVENTS.PAGE_JOIN, {
      pageId: this.currentId,
    });
  }

  leave(socket: Socket): void {
    if (!this.currentId) return;

    socket.emit(SOCKET_EVENTS.PAGE_LEAVE, {
      pageId: this.currentId,
    });
    this.currentId = undefined;
  }

  update(socket: Socket, content: string, onUpdateComplete?: (ok: boolean) => void): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(SOCKET_EVENTS.PAGE_UPDATE, {
      pageId: this.currentId,
      content,
    }, (response: { ok: boolean }) => {
      if (onUpdateComplete) {
        onUpdateComplete(response?.ok ?? false);
      }
    });
  }

  reset(): void {
    this.currentId = undefined;
  }
}
