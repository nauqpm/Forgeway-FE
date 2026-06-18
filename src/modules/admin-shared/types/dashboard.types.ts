export type ForYouWorkspace = {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  key?: string;
  type?: string;
  role?: string;
  status?: string;
  relationship?: string;
  ownershipLabel?: string;
  updatedAt?: string;
  avatar?: string | null;
};

export type ForYouResponse = {
  success?: boolean;
  workspaces?: ForYouWorkspace[];
};

export type UserDashboardStats = {
  tasksAssigned?: number;
  tasksByStatus?: Record<string, number>;
  tasksByPriority?: Record<string, number>;
  recentlyCompleted?: DashboardActivity[];
  recentActivity?: DashboardActivity[];
};

export type DashboardActivity = {
  _id?: string;
  id?: string;
  key?: string;
  title?: string;
  columnId?: string;
  status?: string;
  workspaceId?: string | { _id?: string; id?: string };
};

export type DashboardTask = {
  id: string;
  key: string;
  title: string;
  type: "assigned" | "worked";
  workspaceKey: string;
  meta: string;
  dueDate?: string;
};

export type DashboardWorkspaceCard = ForYouWorkspace & {
  routeKey: string;
  description: string;
};

export type DashboardData = {
  workspaces: ForYouWorkspace[];
  userStats: UserDashboardStats | null;
  assignedTasks: DashboardTask[];
  completedAssignedTasks: DashboardTask[];
};
