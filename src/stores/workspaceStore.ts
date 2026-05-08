import { create } from 'zustand';

interface Workspace {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    members: { userId: string; role: string }[];
}

interface Project {
    _id: string;
    name: string;
    key: string;
    type: 'scrum' | 'kanban';
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
    setProjects: (projects: Project[]) => void;
    setCurrentProject: (project: Project | null) => void;
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
    setProjects: (projects) => set({ projects }),
    setCurrentProject: (project) => set({ currentProject: project }),
}));
