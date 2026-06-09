import { useMemo } from "react";

import { Issue } from "../types/issue.type";
import { Workspace } from "../types/workspace.type";

export const useAssignees = (
  issues: Issue[],
  workspace?: Workspace | null,
) => {
  return useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        avatar?: string;
        color: string;
      }
    >();
    const memberMap = new Map<
      string,
      {
        email?: string;
        name?: string;
        avatar?: string;
      }
    >();

    workspace?.members?.forEach((member) => {
      const user = member.userId;
      if (!user || typeof user === "string") return;
      const id = user._id || user.id;
      if (!id) return;
      memberMap.set(id, {
        email: user.email,
        name: user.fullName || user.name,
        avatar: user.avatar || user.avatarUrl || user.image,
      });
    });

    issues.forEach((i) => {
      const id = i.assigneeId || i.assignee || "U";
      const member = memberMap.get(id);
      if (!map.has(id)) {
        map.set(id, {
          id,
          name:
            id === "U"
              ? "Unassigned"
              : member?.email || i.assigneeDisplayName || member?.name || i.assignee || id,
          avatar: i.assigneeAvatar || member?.avatar,
          color: i.color,
        });
      }
    });

    return Array.from(map.values());
  }, [issues, workspace]);
};
