export interface Workspace {
  _id: string;
  name: string;
  key: string;
  slug?: string;
  ownerId?: string | { _id?: string; id?: string };
  members?: {
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
  | "archive"
  | "pages";

export const getWorkspaceTemplate = (workspace: Workspace): "kanban" | "scrum" =>
  workspace.template ?? workspace.type ?? "kanban";
