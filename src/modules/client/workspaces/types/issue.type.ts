export interface Issue {
  id: string;
  key: string;
  title: string;
  columnId: string;
  status: string;
  priority: string;
  type: string;
  assignee: string;
  assigneeId?: string;
  color: string;
  sprintId: string | null;
  storyPoints: number;
  startDate?: string;
  endDate?: string;
  epic?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archivedByUser?: {
    id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}
