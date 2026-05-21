
// ─── RBAC / Permissions ──────────────────────────────────────────────────────

export type SpaceRoleName = 'space_admin' | 'member' | 'viewer';

export interface SpaceRole {
  spaceId: string;
  spaceName?: string;
  role: SpaceRoleName;
}

export interface Permission {
  id?: string;
  resource: string;
  action: string;
}

export interface SpacePermissions {
  spaceId: string;
  role: SpaceRoleName;
  permissions: Permission[];
}