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
  title: string;
  completed?: boolean;
  assigneeId?: string;
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
  timeLogged?: number;
  timeEstimated?: string | number;
  startDate?: string;
  cover?: TaskCover | null;
  labels?: TaskLabel[];
  labelIds?: string[];
}
