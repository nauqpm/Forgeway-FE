import { create } from "zustand";
import type { Workspace } from "@/modules/workspace/shared/types/workspace.type";

export type { Workspace } from "@/modules/workspace/shared/types/workspace.type";

export interface Project {
  _id: string;
  name: string;
  key: string;
  type: "scrum" | "kanban";
  workspaceId: string;
  status: string;
}

interface WorkspaceStore {
    // Client State
    currentWorkspaceId: string | null;
    currentProjectId: string | null;

    // Actions
    setCurrentWorkspaceId: (id: string | null) => void;
    setCurrentProjectId: (id: string | null) => void;
    setCurrentWorkspace: (workspace: Pick<Workspace, "_id"> | null) => void;
    setCurrentProject: (project: Pick<Project, "_id"> | null) => void;
    clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
    currentWorkspaceId: null,
    currentProjectId: null,

    setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
    setCurrentProjectId: (id) => set({ currentProjectId: id }),
    setCurrentWorkspace: (workspace) => set({ currentWorkspaceId: workspace ? workspace._id : null }),
    setCurrentProject: (project) => set({ currentProjectId: project ? project._id : null }),
    clearWorkspace: () => set({
        currentWorkspaceId: null,
        currentProjectId: null,
    }),
}));
