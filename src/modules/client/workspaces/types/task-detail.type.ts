import type { TaskCover } from "./task-cover.type";

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

  // Frontend-specific fields currently expected by the UI Drawer
  comments?: any[];
  subtasks?: any[];
  timeLogged?: number;
  timeEstimated?: string;
  startDate?: string;
  endDate?: string;
  cover?: TaskCover | null;
}
