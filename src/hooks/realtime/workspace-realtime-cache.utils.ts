import type { RealtimeEnvelope } from '@/lib/socket/socket.types';

export type WorkspaceLike = {
  _id: string;
  id?: string;
  name: string;
  key?: string;
  slug?: string;
  type?: string;
  status?: string;
  access?: string;
  visibility?: 'private' | 'public';
  avatar?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  members?: any[];
};

export type WorkspaceSummaryPayload = Partial<WorkspaceLike> & {
  id?: string;
  _id?: string;
  workspaceId?: string;
  key: string;
  name: string;
};

export type WorkspaceMemberSummaryPayload = {
  userId: string;
  role: string;
};

export type WorkspaceRealtimeEventData = {
  workspaceId: string;
  actorId?: string;
  version?: number;
  userId?: string;
  previousRole?: string;
  nextRole?: string;
  workspace?: WorkspaceSummaryPayload;
  member?: WorkspaceMemberSummaryPayload;
};

export type WorkspaceRealtimeEnvelope =
  RealtimeEnvelope<WorkspaceRealtimeEventData>;

export const workspaceIdOf = (workspace: Partial<WorkspaceLike>): string =>
  workspace._id ?? (workspace as { id?: string }).id ?? '';

export const isSameWorkspace = (
  workspace: Partial<WorkspaceLike>,
  candidate: Partial<WorkspaceLike>,
): boolean => {
  const workspaceId = workspaceIdOf(workspace);
  const candidateId = workspaceIdOf(candidate);

  return Boolean(workspaceId && candidateId && workspaceId === candidateId);
};

export const mapWorkspacePayload = (
  payload?: WorkspaceSummaryPayload,
): WorkspaceLike | null => {
  if (!payload) return null;

  const id = payload.id ?? payload._id ?? payload.workspaceId;
  if (!id || !payload.key || !payload.name) return null;

  return {
    ...payload,
    _id: id,
    key: payload.key,
    name: payload.name,
    slug: payload.slug ?? payload.key,
    visibility:
      payload.visibility ??
      (payload.access === 'private' ? 'private' : 'public'),
    type: payload.type,
    status: payload.status,
    members: payload.members ?? [],
  };
};

export const upsertWorkspace = (
  current: WorkspaceLike[],
  workspace: WorkspaceLike,
): WorkspaceLike[] => {
  const exists = current.some((item) => isSameWorkspace(item, workspace));

  if (exists) {
    return current.map((item) =>
      isSameWorkspace(item, workspace)
        ? { ...item, ...workspace, members: workspace.members ?? item.members }
        : item,
    );
  }

  return [workspace, ...current];
};

export const removeWorkspace = (
  current: WorkspaceLike[],
  workspaceId: string,
): WorkspaceLike[] => current.filter((item) => workspaceIdOf(item) !== workspaceId);

export const updateWorkspaceMemberRole = (
  workspace: WorkspaceLike,
  userId: string,
  role: string,
): WorkspaceLike => ({
  ...workspace,
  members: (workspace.members ?? []).map((member) => {
    const memberUserId =
      typeof member.userId === 'string'
        ? member.userId
        : member.userId?._id ?? member.userId?.id ?? '';

    return memberUserId === userId ? { ...member, role } : member;
  }),
});
