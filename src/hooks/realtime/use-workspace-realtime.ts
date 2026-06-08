'use client';

import { useEffect, useRef } from 'react';
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
  const handledEventIdsRef = useRef<Set<string>>(new Set());
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    const markHandled = (eventId?: string): boolean => {
      if (!eventId) return false;
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

      const nextWorkspaces = upsertWorkspace(workspaces, workspace);
      setWorkspaces(nextWorkspaces as any);

      if (workspaceIdOf(currentWorkspace ?? {}) === workspaceId) {
        setCurrentWorkspace({
          ...currentWorkspace,
          ...workspace,
          members: workspace.members ?? currentWorkspace?.members ?? [],
        } as any);
      }
    };

    const removeWorkspaceFromState = (workspaceId: string) => {
      const nextWorkspaces = removeWorkspace(workspaces, workspaceId);
      setWorkspaces(nextWorkspaces as any);

      if (workspaceIdOf(currentWorkspace ?? {}) === workspaceId) {
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

      const nextWorkspaces = removeWorkspace(workspaces, workspaceId);
      setWorkspaces(nextWorkspaces as any);

      if (workspaceIdOf(currentWorkspace ?? {}) !== workspaceId) return;

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

      const nextWorkspaces = workspaces.map((workspace) =>
        workspaceIdOf(workspace) === workspaceId
          ? updateWorkspaceMemberRole(workspace, userId, nextRole)
          : workspace,
      );
      setWorkspaces(nextWorkspaces as any);

      if (workspaceIdOf(currentWorkspace ?? {}) === workspaceId) {
        setCurrentWorkspace(
          updateWorkspaceMemberRole(currentWorkspace!, userId, nextRole) as any,
        );
      }
    };

    socket.on(WORKSPACE_EVENTS.UPDATED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.ARCHIVED, handleWorkspaceRemoved);
    socket.on(WORKSPACE_EVENTS.RESTORED, handleWorkspaceUpsert);
    socket.on(WORKSPACE_EVENTS.DELETED, handleWorkspaceRemoved);
    socket.on(WORKSPACE_EVENTS.MEMBER_ADDED, handleMemberAdded);
    socket.on(WORKSPACE_EVENTS.MEMBER_REMOVED, handleMemberRemoved);
    socket.on(WORKSPACE_EVENTS.MEMBER_ROLE_UPDATED, handleMemberRoleUpdated);

    return () => {
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
    currentWorkspace,
    enabled,
    router,
    setCurrentWorkspace,
    setWorkspaces,
    workspaces,
  ]);
}
