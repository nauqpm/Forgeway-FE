// Task Mutations - API calls for creating/updating/deleting data
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Issue } from "../types/issue.type";
import type { CreateTaskInput } from "./taskTypes";
import type { ReorderTaskInput } from "./taskTypes";
import {
  normalizeResponseData,
  toIssue,
  toUpdatePayload,
  toColumnId,
  toTaskComment,
  toCreatePayload,
} from "./taskNormalizer";
import type { TaskDto, TaskComment } from "./taskTypes";

/**
 * Create a new board task
 */
export async function createBoardTask(
  workspaceId: string,
  input: CreateTaskInput,
): Promise<Issue> {
  const response = await api.post(
    apiRoutes.TASKS.BOARD(workspaceId),
    toCreatePayload(input),
  );
  return toIssue(normalizeResponseData<TaskDto>(response));
}

/**
 * Update a board task (full update)
 */
export async function updateBoardTask(
  workspaceId: string,
  taskId: string,
  updates: Partial<Issue>,
): Promise<Issue> {
  const hasContentUpdate =
    updates.title !== undefined ||
    updates.description !== undefined ||
    updates.storyPoints !== undefined ||
    updates.startDate !== undefined ||
    updates.dueDate !== undefined ||
    updates.assigneeId !== undefined ||
    updates.assignee !== undefined ||
    updates.type !== undefined ||
    updates.priority !== undefined;

  const isMoveUpdate =
    !hasContentUpdate &&
    (updates.status !== undefined ||
      updates.columnId !== undefined ||
      updates.sprintId !== undefined);

  if (isMoveUpdate) {
    const payload: Record<string, unknown> = {};
    if (updates.columnId !== undefined) {
      payload.columnId = updates.columnId;
      if (updates.status !== undefined) {
        payload.status = toColumnId(updates.status) ?? updates.status;
      }
    } else if (updates.status !== undefined) {
      payload.status = toColumnId(updates.status);
      payload.columnId = toColumnId(updates.status);
    }
    if (updates.sprintId !== undefined) {
      payload.sprintId = updates.sprintId;
    }

    const response = await api.patch(
      apiRoutes.TASKS.BOARD_TASK_MOVE(workspaceId, taskId),
      payload,
    );
    return toIssue(normalizeResponseData<TaskDto>(response));
  }

  const response = await api.patch(
    apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId),
    toUpdatePayload(updates),
  );
  return toIssue(normalizeResponseData<TaskDto>(response));
}

/**
 * Move a board task to a different column
 */
export async function moveBoardTask(
  workspaceId: string,
  taskId: string,
  input: { columnId: string },
): Promise<Issue> {
  const response = await api.patch(
    apiRoutes.TASKS.BOARD_TASK_MOVE(workspaceId, taskId),
    input,
  );
  return toIssue(normalizeResponseData<TaskDto>(response));
}

/**
 * Reorder a board task within/between columns
 */
export async function reorderBoardTask(
  workspaceId: string,
  taskId: string,
  input: ReorderTaskInput,
): Promise<Issue> {
  const response = await api.patch(
    apiRoutes.TASKS.BOARD_TASK_REORDER(workspaceId, taskId),
    input,
  );
  return toIssue(normalizeResponseData<TaskDto>(response));
}

/**
 * Delete a board task
 */
export async function deleteBoardTask(
  workspaceId: string,
  taskId: string,
): Promise<void> {
  await api.delete(apiRoutes.TASKS.BOARD_TASK(workspaceId, taskId), {
    data: { confirmText: "delete" },
  });
}

/**
 * Archive a board task
 */
export async function archiveBoardTask(
  workspaceId: string,
  taskId: string,
): Promise<Issue> {
  const response = await api.patch(
    apiRoutes.TASKS.BOARD_TASK_ARCHIVE(workspaceId, taskId),
  );
  return toIssue(normalizeResponseData<TaskDto>(response));
}

/**
 * Restore an archived board task
 */
export async function restoreBoardTask(
  workspaceId: string,
  taskId: string,
): Promise<Issue> {
  const response = await api.patch(
    apiRoutes.TASKS.BOARD_TASK_RESTORE(workspaceId, taskId),
  );
  return toIssue(normalizeResponseData<TaskDto>(response));
}

/**
 * Replace task labels
 */
export async function replaceTaskLabels(
  workspaceId: string,
  taskId: string,
  labelIds: string[],
): Promise<Issue> {
  const response = await api.patch(
    apiRoutes.TASKS.BOARD_TASK_LABELS(workspaceId, taskId),
    { labelIds },
  );
  return toIssue(normalizeResponseData<TaskDto>(response));
}

/**
 * Create a comment on a task
 */
export async function createComment(
  workspaceId: string,
  taskId: string,
  content: string,
  parentId?: string | null,
  mentions?: string[],
): Promise<TaskComment> {
  const body: Record<string, unknown> = { content };
  if (parentId) body.parentId = parentId;
  if (mentions?.length) body.mentions = mentions;

  const response = await api.post(
    apiRoutes.TASKS.BOARD_TASK_COMMENTS(workspaceId, taskId),
    body,
  );
  return toTaskComment(normalizeResponseData<TaskComment>(response));
}

/**
 * Update a comment
 */
export async function updateComment(
  workspaceId: string,
  taskId: string,
  commentId: string,
  content: string,
): Promise<TaskComment> {
  const response = await api.patch(
    apiRoutes.TASKS.BOARD_TASK_COMMENT(workspaceId, taskId, commentId),
    { content },
  );
  return toTaskComment(normalizeResponseData<TaskComment>(response));
}

/**
 * Delete a comment
 */
export async function deleteComment(
  workspaceId: string,
  taskId: string,
  commentId: string,
): Promise<void> {
  await api.delete(
    apiRoutes.TASKS.BOARD_TASK_COMMENT(workspaceId, taskId, commentId),
  );
}
