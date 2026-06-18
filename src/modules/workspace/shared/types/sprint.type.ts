export interface Sprint {
  _id: string;
  id: string;          // alias for _id — keeps existing code using sprint.id working
  workspaceId: string;
  boardId?: string;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  duration?: string;
}

export interface CreateSprintInput {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
}

export interface StartSprintInput {
  startDate: string;
  endDate: string;
}

export interface CompleteSprintResult {
  _id: string;
  id: string;
  workspaceId: string;
  name: string;
  status: 'completed';
  completedAt: string;
  incompleteTasksMovedTo?: string;
}
