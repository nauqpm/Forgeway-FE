"use client";

import { Issue } from "../../types/issue.type";
import DataGridListView from "./list/DataGridListView";

type ListTabProps = {
  filteredIssues: Issue[];
  setSelectedIssue: (issue: Issue) => void;
  updateIssueDirectly: (issueId: string, updates: Partial<Issue>) => void;
};

export default function ListTab({
  filteredIssues,
  setSelectedIssue,
  updateIssueDirectly,
}: ListTabProps) {
  return (
    <div className="p-4">
      <DataGridListView
        issues={filteredIssues}
        onClickTask={setSelectedIssue}
        onUpdateIssue={updateIssueDirectly}
      />
    </div>
  );
}
