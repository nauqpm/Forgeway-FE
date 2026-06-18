"use client";

import type { EventContentArg } from '@fullcalendar/core';
import { isAfter, parseISO } from 'date-fns';
import { Issue } from '@/modules/workspace/shared/types/issue.type';

export default function CalendarEventContent({ eventInfo }: { eventInfo: EventContentArg }) {
  const { extendedProps, start, end } = eventInfo.event;

  if (extendedProps.type === 'sprint') {
    return (
      <div className="flex h-full w-full items-center overflow-hidden px-1.5">
        <span className="truncate text-[0.6875rem] font-medium text-white">
          {eventInfo.event.title}
        </span>
      </div>
    );
  }

  const issue = extendedProps.rawData as Issue | undefined;
  if (!issue) {
    return (
      <div className="flex h-full w-full items-center overflow-hidden px-1.5">
        <span className="truncate text-[0.6875rem] font-medium text-white">
          {eventInfo.event.title}
        </span>
      </div>
    );
  }
  const isDone = issue.status === 'Done';
  const isOverdue =
    issue.dueDate &&
    isAfter(new Date(), parseISO(issue.dueDate)) &&
    !isDone;

  const isMultiDay =
    end != null &&
    start != null &&
    end.getTime() - start.getTime() > 86_400_000;

  if (isMultiDay) {
    return (
      <div className="flex h-full w-full items-center overflow-hidden px-1.5">
        <span
          className={[
            'truncate text-[0.6875rem] font-semibold text-white',
            isDone ? 'line-through opacity-70' : '',
            isOverdue ? 'text-red-200' : '',
          ].join(' ')}
        >
          {issue.title}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden px-1.5">
      <span
        className={[
          'truncate text-[0.6875rem] font-semibold text-white',
          isDone ? 'line-through opacity-70' : '',
          isOverdue ? 'text-red-200' : '',
        ].join(' ')}
      >
        {issue.title}
      </span>
    </div>
  );
}
