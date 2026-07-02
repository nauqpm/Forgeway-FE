'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { WORKSPACE_EVENTS } from '@/lib/socket/socket.events';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { queryKeys } from '@/shared/constants/queryKeys';
import {
  mapWorkspacePayload,
  removeWorkspace,
  updateWorkspaceMemberRole,
  upsertWorkspace,
  workspaceIdOf,
  type WorkspaceRealtimeEnvelope,
} from '../utils/workspace-realtime-cache.utils';
import type { Workspace } from '@/modules/workspace/shared/types/workspace.type';

type UseWorkspaceRealtimeOptions = {
  enabled?: boolean;
};

const REDIRECT_DELAY_MS = 2_500;
const MAX_HANDLED_EVENT_IDS = 1000; // Prevent memory leak from unbounded Set growth

const isCurrentUserTarget = (
  envelope: WorkspaceRealtimeEnvelope,
  currentUserId?: string,
): boolean => {
  if (!currentUserId || !envelope.data.userId) return false;
  return envelope.data.userId === currentUserId;
};

export function useWorkspaceRealtime({
  enabled = true,
}: UseWorkspaceRealtimeOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);

  // Use refs to store latest state values to avoid stale closures
  const currentWorkspaceIdRef = useRef(currentWorkspaceId);
  const handledEventIdsRef = useRef<Set<string>>(new Set());
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    currentWorkspaceIdRef.current = currentWorkspaceId;
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!enabled) return;

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    // Cleanup function for event deduplication set to prevent memory leak
    const markHandled = (eventId?: string): boolean => {
      if (!eventId) return false;
      
      // Prevent unbounded Set growth
      if (handledEventIdsRef.current.size >= MAX_HANDLED_EVENT_IDS) {
        // Clear oldest entries when limit reached (simple FIFO)
        const entriesToRemove = handledEventIdsRef.current.size - (MAX_HANDLED_EVENT_IDS / 2);
        const iterator = handledEventIdsRef.current.values();
        for (let i = 0; i < entriesToRemove; i++) {
          const next = iterator.next();
          if (next.value) {
            handledEventIdsRef.current.delete(next.value);
          }
        }
      }
      
      if (handledEventIdsRef.current.has(eventId)) return true;
      handledEventIdsRef.current.add(eventId);
      return false;
    };

    const clearRedirectTimer = () => {
      if (!redirectTimerRef.current) return;
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    };

    const updateWorkspacesCache = (updater: (current: Workspace[]) => Workspace[]) => {
      queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.list(), (current = []) => updater(current));
    };

    const syncWorkspace = (workspaceId: string, workspace?: ReturnType<typeof mapWorkspacePayload>) => {
      if (!workspace) return;

      updateWorkspacesCache((current) => upsertWorkspace(current, workspace as Workspace) as Workspace[]);
      if (!currentWorkspaceIdRef.current) setCurrentWorkspaceId(workspaceId);
    };

    const removeWorkspaceFromState = (workspaceId: string) => {
      updateWorkspacesCache((current) => removeWorkspace(current, workspaceId) as Workspace[]);

      if (currentWorkspaceIdRef.current === workspaceId) {
        realtimeSocketClient.leaveCurrentWorkspace();
        setCurrentWorkspaceId(null);
        router.push('/dashboard');
      }
    };

    const handleWorkspaceUpsert = (envelope: WorkspaceRealtimeEnvelope) => {
      if (markHandled(envelope.eventId)) return;

      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      const workspace = mapWorkspacePayload(envelope.data.workspace);
      syncWorkspace(workspaceId, workspace);
    };

    const handleWorkspaceRemoved = (envelope: WorkspaceRealtimeEnvelope) => {
      if (markHandled(envelope.eventId)) return;

      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      if (!workspaceId) return;
      removeWorkspaceFromState(workspaceId);
    };

    const handleMemberAdded = (envelope: WorkspaceRealtimeEnvelope) => {
      if (markHandled(envelope.eventId)) return;

      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      if (!workspaceId) return;

      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(workspaceId),
      });

      if (!isCurrentUserTarget(envelope, currentUserId)) return;

      clearRedirectTimer();
      const workspace = mapWorkspacePayload(envelope.data.workspace);
      syncWorkspace(workspaceId, workspace);
    };

    const handleMemberRemoved = (envelope: WorkspaceRealtimeEnvelope) => {
      if (markHandled(envelope.eventId)) return;

      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      if (!workspaceId) return;

      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(workspaceId),
      });

      if (!isCurrentUserTarget(envelope, currentUserId)) return;

      updateWorkspacesCache((current) => removeWorkspace(current, workspaceId) as Workspace[]);

      if (currentWorkspaceIdRef.current !== workspaceId) return;

      clearRedirectTimer();
      redirectTimerRef.current = setTimeout(() => {
        realtimeSocketClient.leaveCurrentWorkspace();
        setCurrentWorkspaceId(null);
        router.push('/dashboard');
      }, REDIRECT_DELAY_MS);
    };

    const handleMemberRoleUpdated = (envelope: WorkspaceRealtimeEnvelope) => {
      if (markHandled(envelope.eventId)) return;

      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      const userId = envelope.data.userId;
      const nextRole = envelope.data.nextRole ?? envelope.data.member?.role;
      if (!workspaceId || !userId || !nextRole) return;

      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(workspaceId),
      });

      updateWorkspacesCache((current) =>
        current.map((ws) =>
          workspaceIdOf(ws) === workspaceId
            ? updateWorkspaceMemberRole(ws, userId, nextRole) as Workspace
            : ws
        )
      );
    };

    socket.on(WORKSPACE_EVENTS.CREATED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.UPDATED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.ARCHIVED, handleWorkspaceRemoved);
    socket.on(WORKSPACE_EVENTS.RESTORED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.DELETED, handleWorkspaceRemoved);
    socket.on(WORKSPACE_EVENTS.MEMBER_ADDED, handleMemberAdded);
    socket.on(WORKSPACE_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
    socket.on(WORKSPACE_EVENTS.MEMBER_ROLE_UPDATED, handleMemberRoleUpdated);

    const unsubscribeReconnect = realtimeSocketClient.onReconnect(() => {
      const workspaceId = currentWorkspaceIdRef.current;
      if (!workspaceId) return;

      void queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(workspaceId),
      });
    });

    return () => {
      socket.off(WORKSPACE_EVENTS.CREATED, handleWorkspaceUpsert);
      socket.off(WORKSPACE_EVENTS.UPDATED, handleWorkspaceUpsert);
      socket.off(WORKSPACE_EVENTS.ARCHIVED, handleWorkspaceRemoved);
      socket.off(WORKSPACE_EVENTS.RESTORED, handleWorkspaceUpsert);
      socket.off(WORKSPACE_EVENTS.DELETED, handleWorkspaceRemoved);
      socket.off(WORKSPACE_EVENTS.MEMBER_ADDED, handleMemberAdded);
      socket.off(WORKSPACE_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
      socket.off(WORKSPACE_EVENTS.MEMBER_ROLE_UPDATED, handleMemberRoleUpdated);
      unsubscribeReconnect();
      clearRedirectTimer();
    };
  }, [
    currentUserId,
    enabled,
    queryClient,
    router,
    setCurrentWorkspaceId,
  ]);
}
