import type { WorkspaceMember } from "../types/workspace.type";

export type SearchAssignee = {
  id: string;
  name: string;
  avatar?: string;
};

type CurrentUser = {
  id?: string;
  fullName?: string;
  email?: string;
};

export const buildSearchAssignees = (members: WorkspaceMember[], currentUser?: CurrentUser): SearchAssignee[] => {
  const assignees = new Map<string, SearchAssignee>();

  members.forEach((member) => {
    const profile = typeof member.userId === "string" ? undefined : member.userId;
    const id = typeof member.userId === "string" ? member.userId : profile?._id || profile?.id || "";

    if (!id || assignees.has(id)) return;

    const currentUserName = id === currentUser?.id ? currentUser.fullName || currentUser.email : undefined;
    const profileName = profile?.fullName || profile?.name || profile?.email;

    assignees.set(id, {
      id,
      name: currentUserName || profileName || "Unknown member",
      avatar: profile?.avatar || profile?.avatarUrl || profile?.image,
    });
  });

  return Array.from(assignees.values());
};
