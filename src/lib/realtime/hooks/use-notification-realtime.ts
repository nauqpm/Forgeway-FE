'use client';

import { useEffect } from 'react';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { NOTIFICATION_EVENTS } from '@/lib/socket/socket.events';
import type { RealtimeEnvelope } from '@/lib/socket/socket.types';
import type { AppNotification } from '@/modules/notifications/services/notification.service';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';

type NotificationEventData = {
  recipientId?: string;
  notificationId?: string;
  readAt?: string | null;
  notification?: AppNotification;
};

type NotificationRealtimeEnvelope = RealtimeEnvelope<NotificationEventData>;

type NotificationRealtimeOptions = {
  enabled?: boolean;
  onCreated?: (
    notification: AppNotification | undefined,
    envelope: NotificationRealtimeEnvelope,
  ) => void;
  onRead?: (
    notificationId: string | undefined,
    readAt: string | null | undefined,
    envelope: NotificationRealtimeEnvelope,
  ) => void;
  onReadAll?: (envelope: NotificationRealtimeEnvelope) => void;
};

const getRecipientId = (envelope: NotificationRealtimeEnvelope) =>
  envelope.data.recipientId ?? envelope.data.notification?.recipientId;

const belongsToCurrentUser = (
  envelope: NotificationRealtimeEnvelope,
  currentUserId?: string,
) => {
  const recipientId = getRecipientId(envelope);
  if (!currentUserId || !recipientId) return true;
  return recipientId === currentUserId;
};

export function useNotificationRealtime({
  enabled = true,
  onCreated,
  onRead,
  onReadAll,
}: NotificationRealtimeOptions = {}) {
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!enabled) return;

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    const handleCreated = (envelope: NotificationRealtimeEnvelope) => {
      if (!belongsToCurrentUser(envelope, currentUserId)) return;
      onCreated?.(envelope.data.notification, envelope);
    };

    const handleRead = (envelope: NotificationRealtimeEnvelope) => {
      if (!belongsToCurrentUser(envelope, currentUserId)) return;
      onRead?.(envelope.data.notificationId, envelope.data.readAt, envelope);
    };

    const handleReadAll = (envelope: NotificationRealtimeEnvelope) => {
      if (!belongsToCurrentUser(envelope, currentUserId)) return;
      onReadAll?.(envelope);
    };

    socket.on(NOTIFICATION_EVENTS.CREATED, handleCreated);
    socket.on(NOTIFICATION_EVENTS.READ, handleRead);
    socket.on(NOTIFICATION_EVENTS.READ_ALL, handleReadAll);

    return () => {
      socket.off(NOTIFICATION_EVENTS.CREATED, handleCreated);
      socket.off(NOTIFICATION_EVENTS.READ, handleRead);
      socket.off(NOTIFICATION_EVENTS.READ_ALL, handleReadAll);
    };
  }, [currentUserId, enabled, onCreated, onRead, onReadAll]);
}