"use client";

import type { EventContentArg } from '@fullcalendar/core';
import { isAfter, parseISO } from 'date-fns';
import { Issue } from '@/modules/client/workspaces/types/issue.type';

export default function CalendarEventContent({ eventInfo }: { eventInfo: EventContentArg }) {
  const { extendedProps, start, end } = eventInfo.event;

  if (extendedProps.type === 'sprint') {
    return (
      <div className="flex h-full w-full items-center overflow-hidden px-1.5">
        <span className="truncate text-[0.6875rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
          {eventInfo.event.title}
        </span>
      </div>
    );
  }

  const issue = extendedProps.rawData as Issue | undefined;
  if (!issue) {
    return (
      <div className="flex h-full w-full items-center overflow-hidden px-1.5">
        <span className="truncate text-[0.6875rem] font-medium text-[#1F6C9F] dark:text-[#93C5FD]">
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
            'truncate text-[0.6875rem] font-semibold text-[#1F6C9F] dark:text-[#93C5FD]',
            isDone ? 'line-through opacity-60' : '',
            isOverdue ? 'text-[#9F2F2D] dark:text-[#FCA5A5]' : '',
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
          'truncate text-[0.6875rem] font-semibold text-[#1F6C9F] dark:text-[#93C5FD]',
          isDone ? 'line-through opacity-60' : '',
          isOverdue ? 'text-[#9F2F2D] dark:text-[#FCA5A5]' : '',
        ].join(' ')}
      >
        {issue.title}
      </span>
    </div>
  );
}
