"use client";

import TimelineView from "../TimelineView";
import type { Issue } from "../../types/issue.type";
import type { Sprint } from "../../types/sprint.type";

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
    <div className="px-2 py-2">
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
