"use client";

import TimelineView from "../TimelineView";

type TimelineTabProps = {
  filteredIssues: any[];
  sprints: any[];
  handleUpdateIssueDate: any;
  setSelectedIssue: any;
};

export default function TimelineTab({
  filteredIssues,
  sprints,
  handleUpdateIssueDate,
  setSelectedIssue,
}: TimelineTabProps) {
  return (
    <div className="workspace-panel">
      <TimelineView
        issues={filteredIssues}
        sprints={sprints}
        onUpdateIssueDate={handleUpdateIssueDate}
        onClickTask={(issue) => setSelectedIssue(issue)}
      />
    </div>
  );
}
