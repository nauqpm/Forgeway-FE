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

    // We don't necessarily leave other rooms because we want to receive unread updates
    this.currentChannelId = channelId;
    this.joinedChannelIds.add(channelId);
    
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN, { channelId });
    }
  }

  joinMultiple(socket: Socket, channelIds: string[]): void {
    channelIds.forEach(id => this.joinedChannelIds.add(id));
    if (socket.connected) {
      channelIds.forEach(channelId => {
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
    // Note: We might want to keep the room joined for unread updates 
    // but for now let's follow the standard leave logic for the active one
    socket.emit(SOCKET_EVENTS.LEAVE, { channelId: this.currentChannelId });
    this.currentChannelId = undefined;
  }

  reset(): void {
    this.currentChannelId = undefined;
    this.joinedChannelIds.clear();
  }
}
