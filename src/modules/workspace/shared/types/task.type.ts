import type { TaskCover } from "./task-cover.type";
import type { TaskLabel } from "./label.type";

export interface Task {
  id: string;
  _id?: string;
  key: string;
  title: string;
  description?: string;
  columnId: string;
  status: string;
  rank?: string;
  priority: string;
  type: string;
  assignee: string;
  assigneeId?: string | null;
  assigneeDisplayName?: string;
  assigneeAvatar?: string;
  color: string;
  sprintId: string | null;
  storyPoints: number;
  startDate?: string;
  dueDate?: string;
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
  version?: number;
  optimisticOrder?: number;
  optimisticScope?: string;
  cover?: TaskCover | null;
  labels?: TaskLabel[];
  labelIds?: string[];
  timeLogged?: number;
  timeEstimated?: string | number;
}
