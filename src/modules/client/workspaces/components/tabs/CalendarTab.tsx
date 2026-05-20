"use client";

import CalendarView from '@/modules/admin/components/common/components/CalendarView';
import { Issue } from '@/modules/client/workspaces/types/issue.type';
import { Sprint } from '@/modules/client/workspaces/types/sprint.type';

interface CalendarTabProps {
  issues: Issue[];
  sprints: Sprint[];
  handleUpdateIssueDate: (id: string, start: string, end: string) => void;
  setSelectedIssue: (issue: Issue | null) => void;
}

export default function CalendarTab({
  issues,
  sprints,
  handleUpdateIssueDate,
  setSelectedIssue,
}: CalendarTabProps) {
  return (
    <div className="p-4 min-h-[500px]">
      <CalendarView
        issues={issues}
        sprints={sprints}
        onUpdateIssueDate={handleUpdateIssueDate}
        onSelectIssue={setSelectedIssue}
      />
    </div>
  );
}
