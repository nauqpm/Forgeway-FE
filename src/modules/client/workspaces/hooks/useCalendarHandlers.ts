import { useCallback } from 'react';
import { format, subDays } from 'date-fns';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import { toast } from 'react-hot-toast';
import { Issue } from '../types/issue.type';
import { Sprint } from '../types/sprint.type';
import { getSprintDateBoundViolation } from '../utils/sprintDateBounds';

type EventResizeArg = {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
    extendedProps: Record<string, unknown>;
  };
  revert: () => void;
};

type EventReceiveArg = {
  event: {
    id: string;
    start: Date | null;
    extendedProps?: Record<string, unknown>;
    remove: () => void;
  };
};

interface UseCalendarHandlersProps {
  issues: Issue[];
  sprints: Sprint[];
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onSelectIssue: (issue: Issue | null) => void;
}

function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function normalizeDate(value?: string | null): string | undefined {
  return value ? value.split('T')[0] : undefined;
}

function getIssueFromEvent(
  id: string,
  rawData: unknown,
  issues: Issue[],
): Issue | undefined {
  return (rawData as Issue | undefined) ?? issues.find((issue) => issue.id === id);
}

function getIssueSprintBounds(issue: Issue | undefined, sprints: Sprint[]) {
  if (!issue?.sprintId) return null;
  const sprint = sprints.find((item) => issue.sprintId === (item.id ?? item._id));
  if (!sprint) return null;

  return {
    sprintName: sprint.name,
    sprintStartDate: normalizeDate(sprint.startDate),
    sprintEndDate: normalizeDate(sprint.endDate),
  };
}

function getViolationForIssueDate(
  issue: Issue | undefined,
  sprints: Sprint[],
  start: string,
  end: string,
) {
  const bounds = getIssueSprintBounds(issue, sprints);
  return bounds ? getSprintDateBoundViolation(start, end, bounds) : null;
}

function showBlockedMessage(message: string) {
  toast.error(`${message} Cannot move any further.`);
}

export function useCalendarHandlers({
  issues,
  sprints,
  onUpdateIssueDate,
  onSelectIssue,
}: UseCalendarHandlersProps) {
  const onEventDrop = useCallback((arg: EventDropArg) => {
    if (arg.event.extendedProps.type === 'sprint') return;

    const start = toDateStr(arg.event.start!);
    const end = arg.event.end ? toDateStr(subDays(arg.event.end, 1)) : start;
    const issue = getIssueFromEvent(arg.event.id, arg.event.extendedProps.rawData, issues);
    const violation = getViolationForIssueDate(issue, sprints, start, end);

    if (violation) {
      arg.revert();
      showBlockedMessage(violation);
      return;
    }

    onUpdateIssueDate(arg.event.id, start, end);
  }, [issues, sprints, onUpdateIssueDate]);

  const onEventResize = useCallback((arg: EventResizeArg) => {
    if (arg.event.extendedProps.type === 'sprint') return;

    const start = arg.event.start ? toDateStr(arg.event.start) : '';
    const end = arg.event.end ? toDateStr(subDays(arg.event.end, 1)) : start;
    if (!start) return;

    const issue = getIssueFromEvent(arg.event.id, arg.event.extendedProps.rawData, issues);
    const violation = getViolationForIssueDate(issue, sprints, start, end);

    if (violation) {
      arg.revert();
      showBlockedMessage(violation);
      return;
    }

    onUpdateIssueDate(arg.event.id, start, end);
  }, [issues, sprints, onUpdateIssueDate]);

  const onEventReceive = useCallback((arg: EventReceiveArg) => {
    arg.event.remove();
    const start = toDateStr(arg.event.start!);
    const issue = getIssueFromEvent(arg.event.id, arg.event.extendedProps?.rawData, issues);
    const violation = getViolationForIssueDate(issue, sprints, start, start);

    if (violation) {
      showBlockedMessage(violation);
      return;
    }

    onUpdateIssueDate(arg.event.id, start, start);
  }, [issues, sprints, onUpdateIssueDate]);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const rawIssue = arg.event.extendedProps.rawData as Issue | undefined;
    if (arg.event.extendedProps.type === 'issue' && rawIssue) onSelectIssue(rawIssue);
  }, [onSelectIssue]);

  return { onEventDrop, onEventResize, onEventReceive, onEventClick };
}
