import type { TaskCover } from "./task-cover.type";
import type { TaskLabel } from "./label.type";

export interface Comment {
  id: string;
  content: string;
  author?: TaskDetailUser;
  createdAt: string;
  updatedAt?: string;
}

export interface Subtask {
  id: string;
  key: string;
  title: string;
  status: string;
  assigneeId?: string;
  assignee?: TaskDetailUser;
  priority?: string;
  type?: string;
  columnId?: string;
  startDate?: string;
  dueDate?: string;
  updatedAt?: string;
  storyPoints?: number;
}

export interface ParentTaskSummary {
  id: string;
  key: string;
  title: string;
  type: string;
}

export interface SubtaskProgress {
  done: number;
  total: number;
}

export interface TaskDetailUser {
  id?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

export interface TaskDetailSprint {
  id?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

export interface TaskDetailBoard {
  id?: string;
  name?: string;
}

// Extending the raw markdown response to include frontend-specific mock fields 
// like subtasks, comments, timeLogged that are currently expected by the Drawer.
export interface TaskDetailResponse {
  id: string;
  workspaceId: string;
  key: string;
  title: string;
  description: string;
  type: 'bug' | 'task' | 'story' | 'epic' | string;
  priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest' | string;
  status: string;
  columnId: string;
  rank: string;
  
  sprintId?: string | null;
  sprint?: TaskDetailSprint;
  
  boardId?: string | null;
  board?: TaskDetailBoard;
  
  assigneeId?: string | null;
  assignee?: TaskDetailUser | null;
  assigneeDisplayName?: string;
  
  reporterId?: string | null;
  reporter?: TaskDetailUser | null;
  
  archivedBy?: string | null;
  archivedByUser?: TaskDetailUser | null;
  
  storyPoints?: number | null;
  dueDate?: string | null;
  
  isArchived: boolean;
  archivedAt?: string | null;
  
  isDeleted: boolean;
  
  createdAt: string;
  updatedAt: string;
  version?: number;

  // Frontend-specific fields currently expected by the UI Drawer
  comments?: Comment[];
  subtasks?: Subtask[];
  subtaskProgress?: SubtaskProgress;
  parentId?: string | null;
  parent?: ParentTaskSummary;
  timeLogged?: number;
  timeEstimated?: string | number;
  startDate?: string | null;
  cover?: TaskCover | null;
  labels?: TaskLabel[];
  labelIds?: string[];
}
