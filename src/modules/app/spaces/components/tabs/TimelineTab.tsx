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
    <div className="p-4">
      <TimelineView
        issues={filteredIssues}
        sprints={sprints}
        onUpdateIssueDate={handleUpdateIssueDate}
        onClickTask={(issue) => setSelectedIssue(issue)}
      />
    </div>
  );
}