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
  duration?: string;   // UI-only computed field, not from backend
}

export interface CreateSprintInput {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}