import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from './socket.events';

export class ChatRoomManager {
  private currentChannelId?: string;

  get current(): string | undefined {
    return this.currentChannelId;
  }

  join(socket: Socket, channelId: string): void {
    if (this.currentChannelId === channelId) return;

    if (this.currentChannelId && socket.connected) {
      socket.emit(SOCKET_EVENTS.LEAVE, { channelId: this.currentChannelId });
    }

    this.currentChannelId = channelId;
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN, { channelId });
    }
  }

  rejoin(socket: Socket): void {
    if (!this.currentChannelId) return;
    socket.emit(SOCKET_EVENTS.JOIN, { channelId: this.currentChannelId });
  }

  leave(socket: Socket): void {
    if (!this.currentChannelId) return;
    socket.emit(SOCKET_EVENTS.LEAVE, { channelId: this.currentChannelId });
    this.currentChannelId = undefined;
  }

  reset(): void {
    this.currentChannelId = undefined;
  }
}
