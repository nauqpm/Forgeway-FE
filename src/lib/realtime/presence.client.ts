import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { usePresenceStore, PresenceEntry } from '@/stores/presenceStore';
import api from '@/lib/axiosIns';

type SocketWithEmit = {
  emit: (
    event: string,
    data: unknown,
    cb: (res: { currentStatuses?: Array<{ userId: string; status: 'online' | 'offline'; lastSeenAt: string | null }> }) => void,
  ) => void;
  connected: boolean;
};

class PresenceClient {
  private watchedUserIds = new Map<string, number>();
  private heartbeatTimer?: NodeJS.Timeout;
  private unsubscribeReconnect?: () => void;
  private unsubscribeStatus?: () => void;
  private updateListenerAdded = false;

  private pendingSubscribeIds: string[] = [];
  private subscribeFlushTimer?: NodeJS.Timeout;

  public init() {
    this.unsubscribeStatus = realtimeSocketClient.subscribeStatus((snapshot) => {
      if (snapshot.status === 'connected') {
        this.startHeartbeat();
        this.setupUpdateListener();
        this.resubscribeAll();
      } else {
        this.stopHeartbeat();
      }
    });

    this.unsubscribeReconnect = realtimeSocketClient.onReconnect(() => {
      this.resubscribeAll();
    });
  }

  public destroy() {
    if (this.unsubscribeStatus) this.unsubscribeStatus();
    if (this.unsubscribeReconnect) this.unsubscribeReconnect();
    this.stopHeartbeat();
    this.cancelSubscribeFlush();

    const socket = realtimeSocketClient.getSocket();
    if (socket && this.updateListenerAdded) {
      socket.off('presence.update', this.handleUpdate);
      this.updateListenerAdded = false;
    }
  }

  public subscribe(userIds: string[]) {
    const newIdsToWatch: string[] = [];

    userIds.forEach(id => {
      const currentCount = this.watchedUserIds.get(id) || 0;
      if (currentCount === 0) {
        newIdsToWatch.push(id);
      }
      this.watchedUserIds.set(id, currentCount + 1);
    });

    if (newIdsToWatch.length > 0) {
      newIdsToWatch.forEach(id => this.pendingSubscribeIds.push(id));
      if (!this.subscribeFlushTimer) {
        this.subscribeFlushTimer = setTimeout(() => this.flushSubscribeQueue(), 50);
      }
    }
  }

  private flushSubscribeQueue() {
    this.subscribeFlushTimer = undefined;
    if (this.pendingSubscribeIds.length === 0) return;

    const ids = [...new Set(this.pendingSubscribeIds)];
    this.pendingSubscribeIds = [];

    const socket = realtimeSocketClient.getSocket();
    if (ids.length > 0) {
      if (socket?.connected) {
        this.sendSubscribeRequest(ids, socket as unknown as SocketWithEmit);
      } else {
        this.fetchRestPresence(ids);
      }
    }
  }

  private async fetchRestPresence(userIds: string[]) {
    try {
      const res = await api.get('/presence', { params: { ids: userIds.join(',') } });
      if (res.data && Array.isArray(res.data)) {
        const entries: Record<string, PresenceEntry> = {};
        res.data.forEach((s: { userId: string; status: 'online' | 'offline'; lastSeenAt: string | null }) => {
          entries[s.userId] = {
            status: s.status,
            lastSeenAt: s.lastSeenAt,
          };
        });
        usePresenceStore.getState().upsertBatch(entries);
      }
    } catch (err) {
      console.warn('Failed to fetch REST presence fallback:', err);
    }
  }

  private cancelSubscribeFlush() {
    if (this.subscribeFlushTimer) {
      clearTimeout(this.subscribeFlushTimer);
      this.subscribeFlushTimer = undefined;
    }
    this.pendingSubscribeIds = [];
  }

  public unsubscribe(userIds: string[]) {
    const socket = realtimeSocketClient.getSocket();
    const idsToUnwatch: string[] = [];

    userIds.forEach(id => {
      const currentCount = this.watchedUserIds.get(id) || 0;
      if (currentCount <= 1) {
        this.watchedUserIds.delete(id);
        idsToUnwatch.push(id);
        this.pendingSubscribeIds = this.pendingSubscribeIds.filter(p => p !== id);
      } else {
        this.watchedUserIds.set(id, currentCount - 1);
      }
    });

    if (idsToUnwatch.length > 0 && socket?.connected) {
      socket.emit('presence:unsubscribe', { userIds: idsToUnwatch });
    }
  }

  private sendSubscribeRequest(userIds: string[], socket: SocketWithEmit) {
    socket.emit('presence:subscribe', { userIds }, (response: { currentStatuses?: Array<{ userId: string; status: 'online' | 'offline'; lastSeenAt: string | null }> }) => {
      if (response && response.currentStatuses) {
        const entries: Record<string, PresenceEntry> = {};
        response.currentStatuses.forEach((s: { userId: string; status: 'online' | 'offline'; lastSeenAt: string | null }) => {
          entries[s.userId] = {
            status: s.status,
            lastSeenAt: s.lastSeenAt,
          };
        });
        usePresenceStore.getState().upsertBatch(entries);
      }
    });
  }

  private resubscribeAll() {
    const socket = realtimeSocketClient.getSocket();
    if (!socket?.connected) return;

    const allIds = Array.from(this.watchedUserIds.keys());
    if (allIds.length > 0) {
      this.sendSubscribeRequest(allIds, socket as unknown as SocketWithEmit);
    }
  }

  private setupUpdateListener() {
    if (this.updateListenerAdded) return;
    const socket = realtimeSocketClient.getSocket();
    if (!socket) return;

    socket.on('presence.update', this.handleUpdate);
    this.updateListenerAdded = true;
  }

  private handleUpdate = (payload: { userId: string; status: 'online' | 'offline'; lastSeenAt: string | null }) => {
    usePresenceStore.getState().upsert(payload.userId, {
      status: payload.status,
      lastSeenAt: payload.lastSeenAt,
    });
  };

  private startHeartbeat() {
    this.stopHeartbeat();

    const socket = realtimeSocketClient.getSocket();
    if (socket?.connected) {
      socket.emit('presence:heartbeat');
    }

    this.scheduleNextHeartbeat();
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private scheduleNextHeartbeat() {
    const jitter = Math.floor(Math.random() * 10000) - 5000;
    const delay = 25000 + jitter;

    this.heartbeatTimer = setTimeout(() => {
      const socket = realtimeSocketClient.getSocket();
      if (socket?.connected) {
        socket.emit('presence:heartbeat');
      }
      this.scheduleNextHeartbeat();
    }, delay);
  }
}

export const presenceClient = new PresenceClient();
