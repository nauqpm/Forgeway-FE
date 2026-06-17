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
} from '@/modules/workspace/shared/services/taskService';
import type { TaskAttachment } from '@/modules/workspace/shared/types/attachment.type';
import type { Issue } from '@/modules/workspace/shared/types/issue.type';
import type { TaskCover } from '@/modules/workspace/shared/types/task-cover.type';
import type { TaskDetailResponse } from '@/modules/workspace/shared/types/task-detail.type';
import {
  prependActivity,
  removeAttachment,
  removeComment,
  updateTaskCover,
  updateTaskLabels,
  upsertAttachment,
  upsertComment,
} from '../utils/task-detail-cache.utils';
import { queryKeys } from '@/shared/constants/queryKeys';

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
    
    const socket = realtimeSocketClient.getSocket();
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
        queryKeys.tasks.detail(workspaceId, taskKey),
        updater,
      );
    };

    const handleCommentUpserted = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope) || !envelope.data.comment) return;
      queryClient.setQueryData<TaskComment[]>(
        queryKeys.tasks.detailComments(workspaceId, taskId),
        (current) => upsertComment(current, envelope.data.comment as TaskComment),
      );
    };

    const handleCommentDeleted = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      queryClient.setQueryData<TaskComment[]>(
        queryKeys.tasks.detailComments(workspaceId, taskId),
        (current) => removeComment(current, envelope.data.commentId),
      );
    };

    const handleAttachmentAdded = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope) || !envelope.data.attachment) return;
      queryClient.setQueryData<TaskAttachment[]>(
        queryKeys.tasks.attachments(workspaceId, taskId),
        (current) => upsertAttachment(current, envelope.data.attachment as TaskAttachment),
      );
    };

    const handleAttachmentDeleted = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      queryClient.setQueryData<TaskAttachment[]>(
        queryKeys.tasks.attachments(workspaceId, taskId),
        (current) => removeAttachment(current, envelope.data.attachmentId),
      );
    };

    const handleLabelsUpdated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      const labelIds = envelope.data.labelIds ?? [];
      updateTaskDetail((current) => updateTaskLabels(current, labelIds, envelope.data.task));
      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeys.tasks.byWorkspace(workspaceId) },
        (current) =>
          current?.map((issue) =>
            (issue.id || issue._id) === taskId ? { ...issue, labelIds } : issue,
          ),
      );
    };

    const handleCoverUpdated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope)) return;
      updateTaskDetail((current) => updateTaskCover(current, envelope.data.cover ?? null));
      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeys.tasks.byWorkspace(workspaceId) },
        (current) =>
          current?.map((issue) =>
            (issue.id || issue._id) === taskId
              ? { ...issue, cover: envelope.data.cover ?? null }
              : issue,
          ),
      );
    };

    const handleActivityCreated = (envelope: TaskDetailEnvelope) => {
      if (!isCurrentTaskEvent(envelope) || !envelope.data.activity) return;
      queryClient.setQueriesData<PaginatedActivitiesResponse>(
        { queryKey: queryKeys.tasks.activities(workspaceId, taskId) },
        (current) => prependActivity(current, envelope.data.activity as TaskActivity),
      );
    };

    socket.on(TASK_DETAIL_EVENTS.COMMENT_CREATED, handleCommentUpserted);
    socket.on(TASK_DETAIL_EVENTS.COMMENT_UPDATED, handleCommentUpserted);
    socket.on(TASK_DETAIL_EVENTS.COMMENT_DELETED, handleCommentDeleted);
    socket.on(TASK_DETAIL_EVENTS.ATTACHMENT_ADDED, handleAttachmentAdded);
    socket.on(TASK_DETAIL_EVENTS.ATTACHMENT_DELETED, handleAttachmentDeleted);
    socket.on(TASK_DETAIL_EVENTS.LABELS_UPDATED, handleLabelsUpdated);
    socket.on(TASK_DETAIL_EVENTS.COVER_UPDATED, handleCoverUpdated);
    socket.on(TASK_DETAIL_EVENTS.ACTIVITY_CREATED, handleActivityCreated);

    return () => {
      socket.off(TASK_DETAIL_EVENTS.COMMENT_CREATED, handleCommentUpserted);
      socket.off(TASK_DETAIL_EVENTS.COMMENT_UPDATED, handleCommentUpserted);
      socket.off(TASK_DETAIL_EVENTS.COMMENT_DELETED, handleCommentDeleted);
      socket.off(TASK_DETAIL_EVENTS.ATTACHMENT_ADDED, handleAttachmentAdded);
      socket.off(TASK_DETAIL_EVENTS.ATTACHMENT_DELETED, handleAttachmentDeleted);
      socket.off(TASK_DETAIL_EVENTS.LABELS_UPDATED, handleLabelsUpdated);
      socket.off(TASK_DETAIL_EVENTS.COVER_UPDATED, handleCoverUpdated);
      socket.off(TASK_DETAIL_EVENTS.ACTIVITY_CREATED, handleActivityCreated);
    };
  }, [enabled, queryClient, taskId, taskKey, workspaceId]);
}
