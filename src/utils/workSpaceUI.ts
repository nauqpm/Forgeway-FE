import {
  Users,
  FolderKanban,
  BookOpen,
  LayoutDashboard,
  Database,
} from "lucide-react";

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
];

const ICONS = [LayoutDashboard, FolderKanban, BookOpen, Database];

export const getWorkspaceUI = (name?: string) => {
  const safeName = name || "workspace";

  const hash = safeName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return {
    color: COLORS[hash % COLORS.length],
    icon: ICONS[hash % ICONS.length],
  };
};
