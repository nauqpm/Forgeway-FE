import type { Socket } from "socket.io-client";

import { SOCKET_COMMANDS, SOCKET_EVENTS } from "./socket.events";

export interface PageJoinResponse {
  ok: boolean;
  yjsState?: number[];
  stateVector?: number[];
  title?: string;
  content?: string;
}

export class PageRoomManager {
  private currentId?: string;

  get current(): string | undefined {
    return this.currentId;
  }

  /**
   * Join a new page room.  If a different page is already joined it is
   * left first.  onJoin is called once the server ACKs with { ok: true }.
   */
  join(
    socket: Socket,
    pageId: string,
    onJoin?: (response: PageJoinResponse) => void,
  ): void {
    // Already in this room — skip (caller should use sync() to re-fetch state)
    if (this.currentId === pageId) return;

    if (this.currentId && socket.connected) {
      socket.emit(SOCKET_EVENTS.PAGE_LEAVE, { pageId: this.currentId });
    }

    this.currentId = pageId;

    if (socket.connected) {
      socket.emit(
        SOCKET_EVENTS.PAGE_JOIN,
        { pageId },
        (res: PageJoinResponse) => {
          if (res?.ok) onJoin?.(res);
        },
      );
    }
    // If not yet connected the caller is responsible for re-invoking
    // once the CONNECT event fires (see enterEditMode in TiptapEditor).
  }

  /**
   * Re-join after a reconnect.  Unlike join() this always emits and
   * always waits for the ACK so the caller can apply missed updates.
   */
  rejoin(
    socket: Socket,
    onRejoin?: (response: PageJoinResponse) => void,
  ): void {
    if (!this.currentId) return;

    socket.emit(
      SOCKET_EVENTS.PAGE_JOIN,
      { pageId: this.currentId },
      (res: PageJoinResponse) => {
        if (res?.ok) onRejoin?.(res);
      },
    );
  }

  leave(socket: Socket): void {
    if (!this.currentId) return;
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.PAGE_LEAVE, { pageId: this.currentId });
    }
    this.currentId = undefined;
  }

  /**
   * Send an incremental Yjs update to the server.
   * onComplete receives true/false based on server ACK.
   */
  yjsUpdate(
    socket: Socket,
    update: Uint8Array,
    updateId?: string,
    onComplete?: (ok: boolean) => void,
  ): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(
      SOCKET_EVENTS.PAGE_YJS_UPDATE,
      {
        pageId: this.currentId,
        update: Array.from(update),
        updateId,
      },
      (response?: { ok: boolean }) => {
        if (onComplete) {
          onComplete(response?.ok ?? false);
        }
      },
    );
  }

  /** Send a Yjs awareness update (Uint8Array converted to number[]) to the server */
  awarenessUpdate(
    socket: Socket,
    update: Uint8Array,
  ): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(
      SOCKET_EVENTS.PAGE_AWARENESS_UPDATE,
      {
        pageId: this.currentId,
        update: Array.from(update),
      }
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
    payload: { content: string; title: string },
    onComplete?: (ok: boolean) => void,
  ): void {
    if (!this.currentId || !socket.connected) return;

    socket.emit(
      SOCKET_COMMANDS.PAGE_DRAFT_CONTENT,
      { pageId: this.currentId, ...payload },
      (res: { ok: boolean }) => onComplete?.(res?.ok ?? false),
    );
  }

  reset(): void {
    this.currentId = undefined;
  }
}
