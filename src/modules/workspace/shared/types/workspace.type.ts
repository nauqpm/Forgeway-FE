export interface WorkspaceMember {
  userId:
  | string
  | {
    _id?: string;
    id?: string;
    fullName?: string;
    name?: string;
    email?: string;
    avatar?: string;
    avatarUrl?: string;
    image?: string;
  };
  role: string;
}

export interface WorkspaceSettings {
  isImportant?: boolean;
  theme?: string;
  [key: string]: unknown;
}

export interface Workspace {
  _id: string;
  id?: string;
  name: string;
  key: string;
  slug?: string;
  ownerId?: string | { _id?: string; id?: string };
  members?: WorkspaceMember[];
  description?: string;
  avatar?: string;
  settings?: WorkspaceSettings;
  access?: "private" | "public";
  template?: "kanban" | "scrum";
  type?: "kanban" | "scrum";
  status?: "active" | "archived" | string;
  isArchived?: boolean;
  archivedAt?: string | null;
  taskCount?: number;
  tasksCount?: number;
  docsCount?: number;
  issueCount?: number;
  issuesCount?: number;
  _count?: {
    pages?: number;
    docs?: number;
    tasks?: number;
    issues?: number;
  };
}

export type WorkspaceTab =
  | "summary"
  | "board"
  | "backlog"
  | "timeline"
  | "calendar"
  | "list"
  | "archive"
  | "pages"
  | "members"
  | "reports";

export const getWorkspaceTemplate = (workspace: Workspace): "kanban" | "scrum" =>
  workspace.template ?? workspace.type ?? "kanban";
