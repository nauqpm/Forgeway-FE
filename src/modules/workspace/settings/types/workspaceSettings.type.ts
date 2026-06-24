export type WorkspaceStatus = "active" | "archived";
export type WorkspaceAccess = "public" | "private";
export type InviteRole = "workspace_admin" | "space_admin" | "admin" | "member" | "viewer";

export interface WorkspaceInfo {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status?: WorkspaceStatus;
  access?: WorkspaceAccess;
  // visibility?: WorkspaceAccess;
}

export interface WorkspaceSettingsForm {
  name: string;
  description: string;
  status: WorkspaceStatus;
  access: WorkspaceAccess;
}

export interface WorkspaceMember {
  userId: {
    _id: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  };
  role: string;
}

export const ROLE_LABELS: Record<string, string> = {
  workspace_admin: "Administrator",
  space_admin: "Administrator",
  member: "Member",
  viewer: "Viewer",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeWorkspaceInfo = (payload: any): WorkspaceInfo =>
  (payload?.data ?? payload) as WorkspaceInfo;

export const normalizeObjectId = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  const objectIdMatch = trimmed.match(/^ObjectId\(['"]?([a-f0-9]{24})['"]?\)$/i);
  return objectIdMatch?.[1] ?? trimmed;
};

export const getMemberUserId = (member: WorkspaceMember): string => {
  const value = member.userId?._id;
  if (!value) return "";
  return normalizeObjectId(String(value));
};

export function getMemberInitials(member: WorkspaceMember): string {
  const displayName = member.userId?.fullName || member.userId?.email || "?";
  return displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
