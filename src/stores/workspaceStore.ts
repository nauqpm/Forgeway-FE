import { create } from "zustand";

interface Workspace {
    _id: string;
    id?: string;
    name: string;
    key?: string;
    slug: string;
    description?: string;
    avatar?: string;
    ownerId: string | { _id?: string; id?: string };
    members: { userId: string | { _id?: string; id?: string }; role: string }[];
}

interface Project {
  _id: string;
  name: string;
  key: string;
  type: "scrum" | "kanban";
  workspaceId: string;
  status: string;
}

interface WorkspaceStore {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    projects: Project[];
    currentProject: Project | null;
    workspacesLoaded: boolean;
    setWorkspaces: (workspaces: Workspace[]) => void;
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    updateWorkspaceAvatar: (workspaceId: string, avatar: string) => void;
    setProjects: (projects: Project[]) => void;
    setCurrentProject: (project: Project | null) => void;
    clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()((set, get) => ({
    workspaces: [],
    currentWorkspace: null,
    projects: [],
    currentProject: null,
    workspacesLoaded: false,
    setWorkspaces: (workspaces) => {
        const needsAutoSelect = !get().currentWorkspace && workspaces.length > 0;
        set({ workspaces, workspacesLoaded: true });
        if (needsAutoSelect) {
            set({ currentWorkspace: workspaces[0] });
        }
    },
    setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
    updateWorkspaceAvatar: (workspaceId, avatar) => set((state) => ({
        workspaces: state.workspaces.map((workspace) =>
            workspace._id === workspaceId ? { ...workspace, avatar } : workspace,
        ),
        currentWorkspace:
            state.currentWorkspace?._id === workspaceId
                ? { ...state.currentWorkspace, avatar }
                : state.currentWorkspace,
    })),
    setProjects: (projects) => set({ projects }),
    setCurrentProject: (project) => set({ currentProject: project }),
    clearWorkspace: () => set({
        workspaces: [],
        currentWorkspace: null,
        projects: [],
        currentProject: null,
        workspacesLoaded: false,
    }),
}));
