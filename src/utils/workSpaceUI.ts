import {
  FolderKanban,
  BookOpen,
  LayoutDashboard,
  Database,
} from "lucide-react";

const COLORS = [
  "bg-[#2563EB]",
  "bg-[#346538]",
  "bg-[#1F6C9F]",
  "bg-[#9F2F2D]",
  "bg-[#956400]",
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
