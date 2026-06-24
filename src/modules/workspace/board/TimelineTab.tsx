"use client";

import TimelineView from "@/modules/workspace/shared/components/TimelineView";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { Sprint } from "@/modules/workspace/shared/types/sprint.type";

type TimelineTabProps = {
  filteredIssues: Issue[];
  sprints: Sprint[];
  handleUpdateIssueDate: (id: string, start: string, end: string) => void;
  setSelectedIssue: (issue: Issue) => void;
  canMoveTask?: boolean;
};

export default function TimelineTab({
  filteredIssues,
  sprints,
  handleUpdateIssueDate,
  setSelectedIssue,
  canMoveTask = true,
}: TimelineTabProps) {
  return (
    <div className="px-2 py-2 overflow-hidden">
      <TimelineView
        issues={filteredIssues}
        sprints={sprints}
        onUpdateIssueDate={handleUpdateIssueDate}
        onClickTask={(issue) => setSelectedIssue(issue)}
        canMoveTask={canMoveTask}
      />
    </div>
  );
}
