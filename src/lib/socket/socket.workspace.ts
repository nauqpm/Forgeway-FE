import type { Socket } from 'socket.io-client';

import { SOCKET_EVENTS } from './socket.events';

export class WorkspaceRoomManager {
  private currentWorkspaceId?: string;

  get current(): string | undefined {
    return this.currentWorkspaceId;
  }

  switch(socket: Socket, newWorkspaceId?: string): void {
    if (this.currentWorkspaceId && this.currentWorkspaceId !== newWorkspaceId) {
      socket.emit(SOCKET_EVENTS.WORKSPACE_LEAVE, {
        workspaceId: this.currentWorkspaceId,
      });
    }

    if (newWorkspaceId && socket.connected) {
      socket.emit(SOCKET_EVENTS.WORKSPACE_JOIN, {
        workspaceId: newWorkspaceId,
      });
    }

    this.currentWorkspaceId = newWorkspaceId;
  }

  rejoin(socket: Socket): void {
    if (!this.currentWorkspaceId) return;

    socket.emit(SOCKET_EVENTS.WORKSPACE_JOIN, {
      workspaceId: this.currentWorkspaceId,
    });
  }

  leave(socket: Socket): void {
    if (!this.currentWorkspaceId) return;

    socket.emit(SOCKET_EVENTS.WORKSPACE_LEAVE, {
      workspaceId: this.currentWorkspaceId,
    });
    this.currentWorkspaceId = undefined;
  }

  reset(): void {
    this.currentWorkspaceId = undefined;
  }
}