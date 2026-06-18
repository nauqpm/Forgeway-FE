export interface Project {
  _id: string;
  name: string;
  key: string;
  type: "scrum" | "kanban";
  description?: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  members: any[];
}

export interface ProjectDetail {
  _id: string;
  name: string;
  key: string;
  type: string;
  description?: string;
  status: string;
}

export interface Board {
  _id: string;
  name: string;
  columns: { id: string; name: string; order: number }[];
}

export interface Task {
  _id: string;
  key: string;
  title: string;
  type: string;
  priority: string;
  boardColumnId?: string;
  labels: string[];
}

export const PRIORITY_COLORS: Record<string, string> = {
  highest: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-yellow-400",
  low: "border-l-blue-400",
  lowest: "border-l-gray-300",
};

export const TYPE_COLORS: Record<string, string> = {
  task: "bg-gray-400",
  bug: "bg-red-400",
  story: "bg-green-400",
  epic: "bg-purple-500",
};
