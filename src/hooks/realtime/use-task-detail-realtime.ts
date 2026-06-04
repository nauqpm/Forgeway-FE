'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { realtimeSocketClient } from '@/lib/socket/socket.client';
import { TASK_DETAIL_EVENTS } from '@/lib/socket/socket.events';
import type { RealtimeEnvelope } from '@/lib/socket/socket.types';
import type {
  PaginatedActivitiesResponse,
  TaskActivity,
  TaskComment,
} from '@/modules/client/workspaces/services/taskService';
import type { TaskAttachment } from '@/modules/client/workspaces/types/attachment.type';
import type { TaskCover } from '@/modules/client/workspaces/types/task-cover.type';
import type { TaskDetailResponse } from '@/modules/client/workspaces/types/task-detail.type';
import {
  prependActivity,
  removeAttachment,
  removeComment,
  updateTaskCover,
  updateTaskLabels,
  upsertAttachment,
  upsertComment,
} from './task-detail-cache.utils';

type TaskDetailEventData = {
  workspaceId: string;
  taskId: string;
  taskKey: string;
  actorId?: string;
  version?: number;
  commentId?: string;
  comment?: TaskComment;
  attachmentId?: string;
  attachment?: TaskAttachment;
  labelIds?: string[];
  task?: Partial<TaskDetailResponse>;
  cover?: TaskCover | null;
  activityId?: string;
  activity?: TaskActivity;
};

type TaskDetailEnvelope = RealtimeEnvelope<TaskDetailEventData>;

interface UseTaskDetailRealtimeOptions {
  workspaceId?: string;
  taskId?: string;
  taskKey?: string;
  enabled?: boolean;
}

export function useTaskDetailRealtime({
  workspaceId,
  taskId,
  taskKey,
  enabled = true,
}: UseTaskDetailRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !workspaceId || !taskId) return;

    const socket = realtimeSocketClient.connect();
    if (!socket) return;

    const isCurrentTaskEvent = (envelope: TaskDetailEnvelope) => {
      const data = envelope.data;
      return (
        (envelope.workspaceId === workspaceId || data.workspaceId === workspaceId) &&
        data.taskId === taskId
      );
    };

    const updateTaskDetail = (
      updater: (current: TaskDetailResponse | undefined) => TaskDetailResponse | undefined,
    ) => {
      if (!taskKey) return;
      queryClient.setQueryData<TaskDetailResponse>(
        ['taskDetail', workspaceId, taskKey],
        updater,
      );
    };

    const handleCommentCreated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope) || !envelope.data.comment) return;
      queryClient.setQueryData<TaskComment[]>(
        ['taskComments', workspaceId, taskId],
        (current) => upsertComment(current, envelope.data.comment as TaskComment),
      );
    };

    const handleCommentUpdated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope) || !envelope.data.comment) return;
      queryClient.setQueryData<TaskComment[]>(
        ['taskComments', workspaceId, taskId],
        (current) => upsertComment(current, envelope.data.comment as TaskComment),
      );
    };

    const handleCommentDeleted = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      queryClient.setQueryData<TaskComment[]>(
        ['taskComments', workspaceId, taskId],
        (current) => removeComment(current, envelope.data.commentId),
      );
    };

    const handleAttachmentAdded = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope) || !envelope.data.attachment) return;
      queryClient.setQueryData<TaskAttachment[]>(
        ['taskAttachments', workspaceId, taskId],
        (current) => upsertAttachment(current, envelope.data.attachment as TaskAttachment),
      );
    };

    const handleAttachmentDeleted = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      queryClient.setQueryData<TaskAttachment[]>(
        ['taskAttachments', workspaceId, taskId],
        (current) => removeAttachment(current, envelope.data.attachmentId),
      );
    };

    const handleLabelsUpdated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      const labelIds = envelope.data.labelIds ?? [];
      updateTaskDetail((current) => updateTaskLabels(current, labelIds, envelope.data.task));
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    };

    const handleCoverUpdated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      updateTaskDetail((current) => updateTaskCover(current, envelope.data.cover ?? null));
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    };

    const handleActivityCreated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope) || !envelope.data.activity) return;
      queryClient.setQueriesData<PaginatedActivitiesResponse>(
        { queryKey: ['taskActivities', workspaceId, taskId] },
        (current) => prependActivity(current, envelope.data.activity as TaskActivity),
      );
    };

    socket.on(TASK_DETAIL_EVENTS.COMMENT_CREATED, handleCommentCreated);
    socket.on(TASK_DETAIL_EVENTS.COMMENT_UPDATED, handleCommentUpdated);
    socket.on(TASK_DETAIL_EVENTS.COMMENT_DELETED, handleCommentDeleted);
    socket.on(TASK_DETAIL_EVENTS.ATTACHMENT_ADDED, handleAttachmentAdded);
    socket.on(TASK_DETAIL_EVENTS.ATTACHMENT_DELETED, handleAttachmentDeleted);
    socket.on(TASK_DETAIL_EVENTS.LABELS_UPDATED, handleLabelsUpdated);
    socket.on(TASK_DETAIL_EVENTS.COVER_UPDATED, handleCoverUpdated);
    socket.on(TASK_DETAIL_EVENTS.ACTIVITY_CREATED, handleActivityCreated);

    return () => {
      socket.off(TASK_DETAIL_EVENTS.COMMENT_CREATED, handleCommentCreated);
      socket.off(TASK_DETAIL_EVENTS.COMMENT_UPDATED, handleCommentUpdated);
      socket.off(TASK_DETAIL_EVENTS.COMMENT_DELETED, handleCommentDeleted);
      socket.off(TASK_DETAIL_EVENTS.ATTACHMENT_ADDED, handleAttachmentAdded);
      socket.off(TASK_DETAIL_EVENTS.ATTACHMENT_DELETED, handleAttachmentDeleted);
      socket.off(TASK_DETAIL_EVENTS.LABELS_UPDATED, handleLabelsUpdated);
      socket.off(TASK_DETAIL_EVENTS.COVER_UPDATED, handleCoverUpdated);
      socket.off(TASK_DETAIL_EVENTS.ACTIVITY_CREATED, handleActivityCreated);
    };
  }, [enabled, queryClient, taskId, taskKey, workspaceId]);
}