export interface Issue {
  id: string;
  key: string;
  title: string;
  columnId: string;
  status: string;
  priority: string;
  type: string;
  assignee: string;
  color: string;
  sprintId: string | null;
  storyPoints: number;
  startDate?: string;
  endDate?: string;
  epic?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
