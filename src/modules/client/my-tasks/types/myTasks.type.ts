export interface Task {
  _id: string;
  key: string;
  title: string;
  type: "task" | "bug" | "story" | "epic";
  priority: "highest" | "high" | "medium" | "low" | "lowest";
  status: string;
  dueDate?: string;
  projectId?: { _id: string; name: string; key: string };
  assigneeId?: string;
  reporterId?: string;
  storyPoints?: number;
  labels: string[];
  description?: string;
}

export type GroupBy = "status" | "project" | "priority" | "none";

export type SortBy = "priority" | "dueDate" | "updated";

export const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  task: { color: "text-slate-600", bg: "bg-slate-400", label: "Task" },
  bug: { color: "text-red-600", bg: "bg-red-500", label: "Bug" },
  story: { color: "text-green-700", bg: "bg-green-500", label: "Story" },
  epic: { color: "text-purple-600", bg: "bg-purple-500", label: "Epic" },
};

export const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  highest: { color: "text-red-600", bg: "bg-red-500", label: "Highest" },
  high: { color: "text-orange-600", bg: "bg-orange-500", label: "High" },
  medium: { color: "text-yellow-600", bg: "bg-yellow-500", label: "Medium" },
  low: { color: "text-blue-600", bg: "bg-blue-400", label: "Low" },
  lowest: { color: "text-slate-400", bg: "bg-slate-300", label: "Lowest" },
};

export const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  todo: { color: "text-slate-600", bg: "bg-slate-100", label: "To Do" },
  inprogress: { color: "text-blue-700", bg: "bg-blue-100", label: "In Progress" },
  review: { color: "text-purple-700", bg: "bg-purple-100", label: "In Review" },
  done: { color: "text-green-700", bg: "bg-green-100", label: "Done" },
  completed: { color: "text-green-700", bg: "bg-green-100", label: "Completed" },
};

export const groupLabels: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  review: "In Review",
  done: "Done",
  completed: "Completed",
  highest: "Highest Priority",
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
  lowest: "Lowest Priority",
};

export const priorityOrder: Record<string, number> = {
  highest: 0,
  high: 1,
  medium: 2,
  low: 3,
  lowest: 4,
};
