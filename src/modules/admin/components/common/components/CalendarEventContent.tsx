"use client";

import type { EventContentArg } from '@fullcalendar/core';
import { isAfter, parseISO } from 'date-fns';
import { Issue } from '@/modules/client/workspaces/types/issue.type';

export default function CalendarEventContent({ eventInfo }: { eventInfo: EventContentArg }) {
  const { extendedProps, start, end } = eventInfo.event;

  if (extendedProps.type === 'sprint') {
    return (
      <div className="flex h-full w-full items-center overflow-hidden px-1.5">
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/80" />
        <span className="ml-1.5 truncate text-[11px] font-semibold text-white">
          {eventInfo.event.title}
        </span>
      </div>
    );
  }

  const issue = extendedProps.rawData as Issue;
  const isDone = issue.status === 'Done';
  const isOverdue =
    issue.endDate &&
    isAfter(new Date(), parseISO(issue.endDate)) &&
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
            'truncate text-[11px] font-semibold text-white',
            isDone ? 'line-through opacity-60' : '',
            isOverdue ? 'text-red-100' : '',
          ].join(' ')}
        >
          {issue.title}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center gap-1 overflow-hidden px-1">
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: eventInfo.event.backgroundColor ?? '#6366f1' }}
      />
      <span
        className={[
          'truncate text-[11px] font-semibold',
          isDone ? 'line-through opacity-60' : '',
          isOverdue
            ? 'text-red-500 dark:text-red-400'
            : 'text-gray-800 dark:text-gray-200',
        ].join(' ')}
      >
        {issue.title}
      </span>
    </div>
  );
}
