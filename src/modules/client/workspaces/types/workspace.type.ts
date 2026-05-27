export interface Workspace {
  _id: string;
  name: string;
  key: string;
  ownerId?: string | { _id?: string; id?: string };
  members?: {
    userId: string | { _id?: string; id?: string };
    role: string;
  }[];
  description?: string;
  visibility: "private" | "public";
  template?: "kanban" | "scrum";
  type?: "kanban" | "scrum";
}

export type WorkspaceTab =
  | "summary"
  | "board"
  | "backlog"
  | "timeline"
  | "calendar"
  | "list"
  | "pages";

export const getWorkspaceTemplate = (workspace: Workspace): "kanban" | "scrum" =>
  workspace.template ?? workspace.type ?? "kanban";
