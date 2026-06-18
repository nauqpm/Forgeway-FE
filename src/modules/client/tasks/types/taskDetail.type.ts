export interface TaskDetailItem {
  _id: string;
  key: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assigneeId?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reporterId?: any;
  labels: string[];
  dueDate?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectId?: any;
  workspaceId?: string;
  storyPoints?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachments: any[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetailComment {
  _id: string;
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authorId: any;
  createdAt: string;
}

export const typeColors: Record<string, string> = {
  task: "bg-gray-500",
  bug: "bg-red-500",
  story: "bg-green-500",
  epic: "bg-purple-500",
};

export const priorityOptions = [
  { value: "highest", label: "Highest", bg: "bg-red-100", text: "text-red-700" },
  { value: "high", label: "High", bg: "bg-orange-100", text: "text-orange-700" },
  { value: "medium", label: "Medium", bg: "bg-yellow-100", text: "text-yellow-700" },
  { value: "low", label: "Low", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "lowest", label: "Lowest", bg: "bg-gray-100", text: "text-gray-700" },
];
