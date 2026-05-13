import { useMemo } from "react";

import { Issue } from "../types/issue.type";

export const useAssignees = (
  issues: Issue[]
) => {
  return useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        color: string;
      }
    >();

    issues.forEach((i) => {
      if (!map.has(i.assignee)) {
        map.set(i.assignee, {
          id: i.assignee,
          color: i.color,
        });
      }
    });

    return Array.from(map.values());
  }, [issues]);
};