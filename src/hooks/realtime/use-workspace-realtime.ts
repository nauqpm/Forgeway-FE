'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { WORKSPACE_EVENTS } from '@/lib/socket/socket.events';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  mapWorkspacePayload,
  removeWorkspace,
  updateWorkspaceMemberRole,
  upsertWorkspace,
  workspaceIdOf,
  type WorkspaceRealtimeEnvelope,
} from './workspace-realtime-cache.utils';

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
  const currentUserId = useAuthStore((state) => state.user?.id);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );

  // Use refs to store latest state values to avoid stale closures
  const workspacesRef = useRef(workspaces);
  const currentWorkspaceRef = useRef(currentWorkspace);
  const handledEventIdsRef = useRef<Set<string>>(new Set());
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    workspacesRef.current = workspaces;
  }, [workspaces]);

  useEffect(() => {
    currentWorkspaceRef.current = currentWorkspace;
  }, [currentWorkspace]);

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

    const syncWorkspace = (workspaceId: string, workspace?: ReturnType<typeof mapWorkspacePayload>) => {
      if (!workspace) return;

      const nextWorkspaces = upsertWorkspace(workspacesRef.current as any, workspace) as any;
      setWorkspaces(nextWorkspaces);

      const currentWs = currentWorkspaceRef.current;
      if (workspaceIdOf(currentWs ?? {}) === workspaceId) {
        setCurrentWorkspace({
          ...currentWs,
          ...workspace,
          members: workspace.members ?? currentWs?.members ?? [],
        } as any);
      }
    };

    const removeWorkspaceFromState = (workspaceId: string) => {
      const nextWorkspaces = removeWorkspace(workspacesRef.current as any, workspaceId) as any;
      setWorkspaces(nextWorkspaces);

      const currentWs = currentWorkspaceRef.current;
      if (workspaceIdOf(currentWs ?? {}) === workspaceId) {
        realtimeSocketClient.leaveCurrentWorkspace();
        setCurrentWorkspace(null);
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
      if (!isCurrentUserTarget(envelope, currentUserId)) return;

      clearRedirectTimer();
      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      const workspace = mapWorkspacePayload(envelope.data.workspace);
      syncWorkspace(workspaceId, workspace);
    };

    const handleMemberRemoved = (envelope: WorkspaceRealtimeEnvelope) => {
      if (markHandled(envelope.eventId)) return;
      if (!isCurrentUserTarget(envelope, currentUserId)) return;

      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      if (!workspaceId) return;

      const nextWorkspaces = removeWorkspace(workspacesRef.current as any, workspaceId) as any;
      setWorkspaces(nextWorkspaces);

      const currentWs = currentWorkspaceRef.current;
      if (workspaceIdOf(currentWs ?? {}) !== workspaceId) return;

      clearRedirectTimer();
      redirectTimerRef.current = setTimeout(() => {
        realtimeSocketClient.leaveCurrentWorkspace();
        setCurrentWorkspace(null);
        router.push('/dashboard');
      }, REDIRECT_DELAY_MS);
    };

    const handleMemberRoleUpdated = (envelope: WorkspaceRealtimeEnvelope) => {
      if (markHandled(envelope.eventId)) return;

      const workspaceId = envelope.workspaceId ?? envelope.data.workspaceId;
      const userId = envelope.data.userId;
      const nextRole = envelope.data.nextRole ?? envelope.data.member?.role;
      if (!workspaceId || !userId || !nextRole) return;

      const nextWorkspaces = workspacesRef.current.map((ws) =>
        workspaceIdOf(ws) === workspaceId
          ? updateWorkspaceMemberRole(ws as any, userId, nextRole) as any
          : ws
      );
      setWorkspaces(nextWorkspaces);

      const currentWs = currentWorkspaceRef.current;
      if (workspaceIdOf(currentWs ?? {}) === workspaceId) {
        if (currentWs) {
          setCurrentWorkspace(updateWorkspaceMemberRole(currentWs as any, userId, nextRole) as any);
        }
      }
    };

    socket.on(WORKSPACE_EVENTS.CREATED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.UPDATED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.ARCHIVED, handleWorkspaceRemoved);
    socket.on(WORKSPACE_EVENTS.RESTORED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.DELETED, handleWorkspaceRemoved);
    socket.on(WORKSPACE_EVENTS.MEMBER_ADDED, handleMemberAdded);
    socket.on(WORKSPACE_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
    socket.on(WORKSPACE_EVENTS.MEMBER_ROLE_UPDATED, handleMemberRoleUpdated);

    return () => {
      socket.off(WORKSPACE_EVENTS.CREATED, handleWorkspaceUpsert);
      socket.off(WORKSPACE_EVENTS.UPDATED, handleWorkspaceUpsert);
      socket.off(WORKSPACE_EVENTS.ARCHIVED, handleWorkspaceRemoved);
      socket.off(WORKSPACE_EVENTS.RESTORED, handleWorkspaceUpsert);
      socket.off(WORKSPACE_EVENTS.DELETED, handleWorkspaceRemoved);
      socket.off(WORKSPACE_EVENTS.MEMBER_ADDED, handleMemberAdded);
      socket.off(WORKSPACE_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
      socket.off(WORKSPACE_EVENTS.MEMBER_ROLE_UPDATED, handleMemberRoleUpdated);
      clearRedirectTimer();
    };
  }, [
    currentUserId,
    enabled,
    router,
    setCurrentWorkspace,
    setWorkspaces,
  ]);
}
