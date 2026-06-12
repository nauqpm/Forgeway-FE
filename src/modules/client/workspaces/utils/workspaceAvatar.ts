export interface WorkspaceAvatarSource {
  _id?: string;
  avatar?: string | null;
  name?: string | null;
  key?: string | null;
}

export interface WorkspaceSampleAvatar {
  id: string;
  publicId: string;
  url: string;
}

export const DEFAULT_WORKSPACE_AVATAR_URL =
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar.png";

export const getWorkspaceAvatarUrl = (workspace?: WorkspaceAvatarSource | null) =>
  workspace?.avatar || DEFAULT_WORKSPACE_AVATAR_URL;

export const getWorkspaceAvatarInitial = (workspace?: WorkspaceAvatarSource | null) =>
  (workspace?.name?.trim().charAt(0) || workspace?.key?.trim().charAt(0) || "W").toUpperCase();

export const selectRandomWorkspaceAvatar = (
  avatars: WorkspaceSampleAvatar[],
  random: () => number = Math.random,
) => {
  if (avatars.length === 0) return DEFAULT_WORKSPACE_AVATAR_URL;
  const index = Math.min(Math.floor(random() * avatars.length), avatars.length - 1);
  return avatars[index].url;
};

export const updateWorkspaceAvatarInList = <T extends WorkspaceAvatarSource>(
  workspaces: T[],
  workspaceId: string,
  avatar: string,
) =>
  workspaces.map((workspace) =>
    workspace._id === workspaceId ? ({ ...workspace, avatar } as T) : workspace,
  );
