// Task Types - Data Transfer Objects and domain types
import type { TaskCover } from "../types/task-cover.type";
import type { TaskLabel } from "../types/label.type";

// DTO types from API
export type TaskUserDto = {
  id?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
} | null;

export type TaskSprintDto = {
  id?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
} | null;

export type TaskBoardDto = {
  id?: string;
  name?: string;
} | null;

export type TaskDto = {
  _id?: string;
  id?: string;
  workspaceId?: string;
  key: string;
  title: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
  rank?: string;
  version?: number;
  assigneeId?: string | null;
  assignee?: TaskUserDto;
  reporterId?: string;
  reporter?: TaskUserDto;
  sprintId?: string;
  sprint?: TaskSprintDto;
  boardId?: string;
  board?: TaskBoardDto;
  columnId?: string;
  boardColumnId?: string;
  storyPoints?: number;
  startDate?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archivedByUser?: {
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  cover?: TaskCover | null;
  labels?: (TaskLabel | string | { _id?: string; id?: string; name?: string })[];
  labelIds?: string[];
};

// Input types for creating/updating tasks
export type CreateTaskInput = {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
  assigneeId?: string | null;
  columnId?: string | null;
  startDate?: string;
  dueDate?: string;
};

export type ReorderTaskInput = {
  columnId?: string;
  status?: string;
  sprintId?: string | null;
  rankScope?: "board" | "sprint";
  beforeTaskId?: string;
  afterTaskId?: string;
};

// Activity and Comment types
export type TaskActivity = {
  id: string;
  workspaceId?: string;
  taskId: string;
  taskKey?: string;
  actorId?: string;
  actor?: {
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type TaskComment = {
  id: string;
  _id?: string;
  workspaceId: string;
  content: string;
  authorId: string;
  author: {
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
  targetType: string;
  targetId: string;
  parentId: string | null;
  mentions: string[];
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
};

// Paginated response types
export type PaginatedActivitiesResponse = {
  activities: TaskActivity[];
  total: number;
  page: number;
  limit: number;
};

export type PaginatedTasksResponse = {
  tasks: import("../types/issue.type").Issue[];
  total: number;
  page: number;
  limit: number;
};
