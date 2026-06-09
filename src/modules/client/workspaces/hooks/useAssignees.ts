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

  const id = user._id ?? user.id ?? "";
  const name = user.fullName || user.name || user.email || id;

  return {
    id,
    name,
    email: user.email,
    avatar: user.avatar || user.avatarUrl || user.image,
  };
};

export const buildAssigneeFilters = (
  issues: Issue[],
  members?: Workspace["members"],
) => {
  const memberById = new Map(
    (members ?? [])
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
    const id = issue.assigneeId || issue.assignee;
    if (!id || map.has(id)) return;

    const member = memberById.get(id);
    const name = issue.assigneeDisplayName || member?.name;
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
  members?: Workspace["members"],
) => {
  return useMemo(
    () => buildAssigneeFilters(issues, members),
    [issues, members],
  );
};
