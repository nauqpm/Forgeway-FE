export interface Workspace {
  _id: string;
  name: string;
  key: string;
  description?: string;
  visibility: "private" | "public";
  template: "kanban" | "scrum";
}