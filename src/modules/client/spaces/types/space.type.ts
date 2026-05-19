export interface Space {
  _id: string;
  name: string;
  key: string;
  description?: string;
  visibility: "private" | "public";
  template: "kanban" | "scrum";
}