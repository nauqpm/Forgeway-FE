import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from './socket.events';

export class ChatRoomManager {
  private currentChannelId?: string;
  private joinedChannelIds = new Set<string>();

  get current(): string | undefined {
    return this.currentChannelId;
  }

  join(socket: Socket, channelId: string): void {
    if (this.currentChannelId === channelId) return;

    this.currentChannelId = channelId;
    const alreadyJoined = this.joinedChannelIds.has(channelId);
    this.joinedChannelIds.add(channelId);
    
    if (socket.connected && !alreadyJoined) {
      socket.emit(SOCKET_EVENTS.JOIN, { channelId });
    }
  }

  joinMultiple(socket: Socket, channelIds: string[]): void {
    const newChannelIds = channelIds.filter(id => !this.joinedChannelIds.has(id));
    if (newChannelIds.length === 0) return;

    newChannelIds.forEach(id => this.joinedChannelIds.add(id));
    if (socket.connected) {
      newChannelIds.forEach(channelId => {
        socket.emit(SOCKET_EVENTS.JOIN, { channelId });
      });
    }
  }

  rejoin(socket: Socket): void {
    if (this.joinedChannelIds.size === 0) return;
    this.joinedChannelIds.forEach(channelId => {
      socket.emit(SOCKET_EVENTS.JOIN, { channelId });
    });
  }

  leave(socket: Socket): void {
    if (!this.currentChannelId) return;
    socket.emit(SOCKET_EVENTS.LEAVE, { channelId: this.currentChannelId });
    this.joinedChannelIds.delete(this.currentChannelId);
    this.currentChannelId = undefined;
  }

  reset(): void {
    this.currentChannelId = undefined;
    this.joinedChannelIds.clear();
  }
}
