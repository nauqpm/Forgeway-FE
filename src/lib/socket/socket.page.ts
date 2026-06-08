import type { Socket } from 'socket.io-client';

import { SOCKET_EVENTS } from './socket.events';

export interface PageJoinResponse {
  ok: boolean;
  yjsState?: number[];
  stateVector?: number[];
  content?: string;
  title?: string;
}

export class PageRoomManager {
  private currentId?: string;

  get current(): string | undefined {
    return this.currentId;
  }

  join(
    socket: Socket,
    newPageId: string,
    onJoinSuccess?: (response: PageJoinResponse) => void,
  ): void {
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
      socket.emit(
        SOCKET_EVENTS.PAGE_JOIN,
        { pageId: newPageId },
        (response: PageJoinResponse) => {
          if (response.ok && onJoinSuccess) {
            onJoinSuccess(response);
          }
        },
      );
    }
  }

  rejoin(socket: Socket): void {
    if (!this.currentId) return;

    socket.emit(SOCKET_EVENTS.PAGE_JOIN, {
      pageId: this.currentId,
    });
  }

  sync(
    socket: Socket,
    onSyncSuccess?: (response: PageJoinResponse) => void,
  ): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(
      SOCKET_EVENTS.PAGE_JOIN,
      { pageId: this.currentId },
      (response: PageJoinResponse) => {
        if (response?.ok && onSyncSuccess) {
          onSyncSuccess(response);
        }
      },
    );
  }

  leave(socket: Socket): void {
    if (!this.currentId) return;

    socket.emit(SOCKET_EVENTS.PAGE_LEAVE, {
      pageId: this.currentId,
    });
    this.currentId = undefined;
  }

  /** Send a Yjs incremental update (binary as number[]) to the server */
  yjsUpdate(
    socket: Socket,
    update: Uint8Array,
    onComplete?: (ok: boolean) => void,
  ): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(
      SOCKET_EVENTS.PAGE_YJS_UPDATE,
      {
        pageId: this.currentId,
        update: Array.from(update),
      },
      (response: { ok: boolean }) => {
        if (onComplete) {
          onComplete(response?.ok ?? false);
        }
      },
    );
  }

  /** Send derived HTML content + title to server for search/fallback storage */
  sendDraftContent(
    socket: Socket,
    content: string,
    title: string,
  ): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(SOCKET_EVENTS.PAGE_DRAFT_CONTENT, {
      pageId: this.currentId,
      content,
      title,
    });
  }

  /** Legacy update method — kept for backward compatibility */
  update(
    socket: Socket,
    content: string,
    onUpdateComplete?: (ok: boolean) => void,
  ): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(
      SOCKET_EVENTS.PAGE_UPDATE,
      {
        pageId: this.currentId,
        content,
      },
      (response: { ok: boolean }) => {
        if (onUpdateComplete) {
          onUpdateComplete(response?.ok ?? false);
        }
      },
    );
  }

  reset(): void {
    this.currentId = undefined;
  }
}
