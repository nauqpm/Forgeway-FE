import { useCallback } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import { toast } from 'react-hot-toast';
import { Issue } from '../types/issue.type';
import { Sprint } from '../types/sprint.type';
import { getSprintDateBoundViolation } from '../utils/sprintDateBounds';
import { normalizeDate } from '../utils/dateUtils';

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

type HandleEventReceiveArgs = {
  arg: EventReceiveArg;
  issues: Issue[];
  sprints: Sprint[];
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onBlocked: (message: string) => void;
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

export function handleEventReceive({
  arg,
  issues,
  sprints,
  onUpdateIssueDate,
  onBlocked,
}: HandleEventReceiveArgs) {
  // Phase 3: guard against null start
  if (!arg.event.start) {
    arg.event.remove();
    return;
  }

  const start = toDateStr(arg.event.start);
  const issue = getIssueFromEvent(arg.event.id, arg.event.extendedProps?.rawData, issues);

  // Phase 4: preserve original duration so sprint bound check covers the full task range
  const end = (() => {
    if (issue?.startDate && issue?.dueDate) {
      const durationDays = Math.max(
        0,
        differenceInCalendarDays(parseISO(issue.dueDate), parseISO(issue.startDate)),
      );
      return toDateStr(addDays(parseISO(start), durationDays));
    }
    return start;
  })();

  const violation = getViolationForIssueDate(issue, sprints, start, end);

  if (violation) {
    arg.event.remove();
    onBlocked(violation);
    return;
  }

  arg.event.remove();
  onUpdateIssueDate(arg.event.id, start, end);
}

export function useCalendarHandlers({
  issues,
  sprints,
  onUpdateIssueDate,
  onSelectIssue,
}: UseCalendarHandlersProps) {
  // Phase 3: guard on oldEvent.start
  // Phase 5: use oldEvent + delta to avoid wrong position when event start is hidden in "+ X more" popover
  const onEventDrop = useCallback((arg: EventDropArg) => {
    if (arg.event.extendedProps.type === 'sprint') return;

    if (!arg.oldEvent.start) {
      arg.revert();
      return;
    }

    const issue = getIssueFromEvent(arg.event.id, arg.event.extendedProps.rawData, issues);

    const deltaDays = arg.delta.days + Math.round(arg.delta.milliseconds / 86_400_000);

    const anchorStart = issue?.startDate ?? toDateStr(arg.oldEvent.start);
    const anchorEnd = issue?.dueDate
      ?? (arg.oldEvent.end ? toDateStr(subDays(arg.oldEvent.end, 1)) : anchorStart);

    const start = toDateStr(addDays(parseISO(anchorStart), deltaDays));
    const end = toDateStr(addDays(parseISO(anchorEnd), deltaDays));

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
    handleEventReceive({
      arg,
      issues,
      sprints,
      onUpdateIssueDate,
      onBlocked: showBlockedMessage,
    });
  }, [issues, sprints, onUpdateIssueDate]);

  const onEventClick = useCallback((arg: EventClickArg) => {
    const rawIssue = arg.event.extendedProps.rawData as Issue | undefined;
    if (arg.event.extendedProps.type === 'issue' && rawIssue) onSelectIssue(rawIssue);
  }, [onSelectIssue]);

  return { onEventDrop, onEventResize, onEventReceive, onEventClick };
}
