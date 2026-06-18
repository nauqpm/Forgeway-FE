export interface Sprint {
  _id: string;
  name: string;
  goal?: string;
  workspaceId?: string | { _id: string; name: string; key: string };
  projectId: { _id: string; name: string; key: string };
  startDate?: string;
  endDate?: string;
  status: "planning" | "active" | "completed";
  taskCount?: number;
  completedTaskCount?: number;
  totalStoryPoints?: number;
  completedStoryPoints?: number;
}

export interface SprintStats {
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  completedPoints: number;
}
