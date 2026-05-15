export interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  assignee: string;
  color: string;
  sprintId: string | null;
  storyPoints: number;
  startDate?: string;
  endDate?: string;
}