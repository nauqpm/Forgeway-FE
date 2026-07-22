"use client";

import CalendarView from '@/modules/admin-shared/components/common/components/CalendarView';
import { Issue } from '@/modules/workspace/shared/types/issue.type';
import { Sprint } from '@/modules/workspace/shared/types/sprint.type';

interface CalendarTabProps {
  issues: Issue[];
  sprints: Sprint[];
  handleUpdateIssueDate: (id: string, start: string, end: string) => void;
  setSelectedIssue: (issue: Issue | null) => void;
  onQuickCreateTask?: (title: string, date: string) => Promise<void> | void;
}

export default function CalendarTab({
  issues,
  sprints,
  handleUpdateIssueDate,
  setSelectedIssue,
  onQuickCreateTask,
}: CalendarTabProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col p-2">
      <div className="flex min-h-0 min-w-0 flex-1">
        <CalendarView
          issues={issues}
          sprints={sprints}
          onUpdateIssueDate={handleUpdateIssueDate}
          onSelectIssue={setSelectedIssue}
          onQuickCreateTask={onQuickCreateTask}
        />
      </div>
    </div>
  );
}
