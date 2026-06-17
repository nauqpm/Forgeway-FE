import { useMemo } from "react";

import { Issue } from "../types/issue.type";
import { Workspace } from "../types/workspace.type";

type WorkspaceMember = NonNullable<Workspace["members"]>[number];

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getMemberUser = (member: WorkspaceMember) => {
  const user = member.userId;
  if (typeof user === "string") {
    return { id: user, name: user };
  }

  const id = user?._id ?? user?.id ?? "";
  const name = user?.fullName || user?.name || user?.email || id;

  return {
    id,
    name,
    email: user?.email,
    avatar: user?.avatar || user?.avatarUrl || user?.image,
  };
};

export const buildAssigneeFilters = (
  issues: Issue[],
  workspace?: Workspace | null,
) => {
  const memberById = new Map(
    (workspace?.members ?? [])
      .map(getMemberUser)
      .filter((member) => member.id)
      .map((member) => [member.id, member]),
  );

  const map = new Map<
    string,
    {
      id: string;
      color: string;
      name?: string;
      email?: string;
      avatar?: string;
      initials?: string;
    }
  >();

  issues.forEach((issue) => {
    const id = issue.assigneeId || issue.assignee || "U";
    if (map.has(id)) return;

    const member = memberById.get(id);
    const name =
      id === "U"
        ? "Unassigned"
        : issue.assigneeDisplayName || member?.name || issue.assignee || id;
    const avatar = issue.assigneeAvatar || member?.avatar;

    map.set(id, {
      id,
      color: issue.color,
      name,
      email: member?.email,
      avatar,
      initials: name ? getInitials(name) : undefined,
    });
  });

  return Array.from(map.values());
};

export const useAssignees = (
  issues: Issue[],
  workspace?: Workspace | null,
) => {
  return useMemo(
    () => buildAssigneeFilters(issues, workspace),
    [issues, workspace],
  );
};
