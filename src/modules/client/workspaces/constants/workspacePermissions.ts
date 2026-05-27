export const WORKSPACE_PERMISSIONS = {
  WORKSPACE_UPDATE: "workspace:update",
  WORKSPACE_DELETE: "workspace:delete",
  TASK_CREATE: "task:create",
  TASK_EDIT: "task:edit",
  TASK_DELETE: "task:delete",
  TASK_MOVE: "task:move",
  SPRINT_MANAGE: "sprint:manage",
  PAGE_CREATE: "page:create",
  PAGE_EDIT: "page:edit",
  PAGE_DELETE: "page:delete",
} as const;

export type WorkspacePermission =
  (typeof WORKSPACE_PERMISSIONS)[keyof typeof WORKSPACE_PERMISSIONS];

export const WORKSPACE_ROLE_PERMISSIONS: Record<string, WorkspacePermission[]> = {
  workspace_admin: Object.values(WORKSPACE_PERMISSIONS),
  member: [
    WORKSPACE_PERMISSIONS.TASK_CREATE,
    WORKSPACE_PERMISSIONS.TASK_EDIT,
    WORKSPACE_PERMISSIONS.TASK_DELETE,
    WORKSPACE_PERMISSIONS.TASK_MOVE,
    WORKSPACE_PERMISSIONS.SPRINT_MANAGE,
    WORKSPACE_PERMISSIONS.PAGE_CREATE,
    WORKSPACE_PERMISSIONS.PAGE_EDIT,
    WORKSPACE_PERMISSIONS.PAGE_DELETE,
  ],
  viewer: [],
};
