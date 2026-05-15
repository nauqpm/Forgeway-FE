# Calendar Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-featured Calendar tab to the Space page showing issues/sprints as draggable events, with an Unscheduled Sidebar for drag-to-schedule workflow.

**Architecture:** FullCalendar (dayGridMonth/Week) renders events mapped from `issues` + `sprints` state. Custom toolbar, event renderer, and unscheduled sidebar live in `common/components/`. A thin `CalendarTab` wrapper in `spaces/components/tabs/` feeds data from the existing page state — no new page-level state needed.

**Tech Stack:** `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`, `date-fns` (already installed), TailwindCSS dark: variants.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/modules/app/spaces/types/calendar.type.ts` | `CalendarViewType`, `CalendarFilters` types |
| Create | `src/modules/app/spaces/hooks/useCalendarData.ts` | Map issues/sprints → FC EventInput[] + unscheduledTasks[] |
| Create | `src/modules/app/spaces/hooks/useCalendarHandlers.ts` | eventDrop / eventResize / eventReceive / eventClick |
| Create | `src/modules/app/common/components/CalendarEventContent.tsx` | Custom event renderer (dot/bar, done/overdue styles) |
| Create | `src/modules/app/common/components/UnscheduledSidebar.tsx` | Draggable task list panel |
| Create | `src/modules/app/common/components/CalendarToolbar.tsx` | 2-row toolbar with nav, view switch, filters, sidebar toggle |
| Create | `src/modules/app/common/components/CalendarView.tsx` | FullCalendar instance, local filter state, layout |
| Create | `src/modules/app/spaces/components/tabs/CalendarTab.tsx` | Thin wrapper — imports CalendarView, adapts prop names |
| Modify | `src/styles/globals.css` | Add FullCalendar dark/light CSS overrides |
| Modify | `src/config/apiRoutes.ts` | Add `TASKS.UPDATE` route |
| Modify | `src/modules/app/spaces/components/common/Tabs.tsx` | Add Calendar button |
| Modify | `src/modules/app/spaces/components/SpaceContent.tsx` | Add calendar render block + calendarProps type |
| Modify | `src/app/(app)/spaces/[id]/page.tsx` | Extend activeTab union, add calendarProps |

---

## Task 1: Install FullCalendar packages

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Install packages**

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/core
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Verify installed**

```bash
node -e "require('@fullcalendar/react'); require('@fullcalendar/daygrid'); require('@fullcalendar/interaction'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install fullcalendar packages for calendar tab"
```

---

## Task 2: Create types and patch API routes

**Files:**
- Create: `src/modules/app/spaces/types/calendar.type.ts`
- Modify: `src/config/apiRoutes.ts`

- [ ] **Step 1: Create `calendar.type.ts`**

```typescript
// src/modules/app/spaces/types/calendar.type.ts

export type CalendarViewType = 'dayGridMonth' | 'dayGridWeek';

export interface CalendarFilters {
  search: string;
  assignees: string[];
  types: string[];
  statuses: string[];
}
```

- [ ] **Step 2: Add `TASKS.UPDATE` to `apiRoutes.ts`**

In `src/config/apiRoutes.ts`, inside the `TASKS` object (after line `STATUS: (id: string) => \`/tasks/${id}/status\``), add:

```typescript
        UPDATE: (id: string) => `/tasks/${id}`,
```

The full TASKS block should look like:
```typescript
    TASKS: {
        BASE: '/tasks',
        BY_ID: (id: string) => `/tasks/${id}`,
        BY_KEY: (key: string) => `/tasks/key/${key}`,
        BY_PROJECT: (projectId: string) => `/tasks/project/${projectId}`,
        BY_SPRINT: (sprintId: string) => `/tasks/sprint/${sprintId}`,
        BY_BOARD: (boardId: string) => `/tasks/board/${boardId}`,
        ASSIGNEE: (userId: string) => `/tasks/assignee/${userId}`,
        MOVE: (id: string) => `/tasks/${id}/move`,
        ASSIGN: (id: string) => `/tasks/${id}/assign`,
        STATUS: (id: string) => `/tasks/${id}/status`,
        LABELS: (id: string) => `/tasks/${id}/labels`,
        UPDATE: (id: string) => `/tasks/${id}`,
    },
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/app/spaces/types/calendar.type.ts src/config/apiRoutes.ts
git commit -m "feat: add calendar types and TASKS.UPDATE api route"
```

---

## Task 3: Add FullCalendar CSS overrides

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Append FC overrides at end of `globals.css`**

Add this block at the very end of `src/styles/globals.css`:

```css
/* ── FullCalendar overrides ── */
.fc .fc-toolbar.fc-header-toolbar {
  display: none; /* Use custom CalendarToolbar instead */
}

/* Light mode */
.fc {
  --fc-border-color: #e5e7eb;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #f9fafb;
  --fc-today-bg-color: rgba(99, 102, 241, 0.05);
}
.fc .fc-daygrid-day-number {
  color: #374151;
  font-size: 0.75rem;
  padding: 4px 6px;
}
.fc .fc-col-header-cell-cushion {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 4px;
  text-decoration: none;
}
.fc .fc-daygrid-day-number {
  text-decoration: none;
}

/* Dark mode */
.dark .fc {
  --fc-border-color: #374151;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #1f2937;
  --fc-today-bg-color: rgba(59, 130, 246, 0.1);
  color: #f3f4f6;
}
.dark .fc .fc-daygrid-day-number {
  color: #d1d5db;
}
.dark .fc .fc-col-header-cell-cushion {
  color: #9ca3af;
}
.dark .fc .fc-scrollgrid {
  border-color: #374151;
}

/* Sprint event bar style */
.fc .sprint-event {
  opacity: 0.9;
  border-radius: 4px;
}

/* Make single-day events transparent background so custom content shows */
.fc .fc-daygrid-event {
  background: transparent;
  border: none;
  box-shadow: none;
}
/* Re-apply background only for multi-day block events */
.fc .fc-daygrid-block-event {
  background: var(--fc-event-bg-color, #3b82f6);
  border-radius: 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add fullcalendar dark theme CSS overrides"
```

---

## Task 4: Create `useCalendarData` hook

**Files:**
- Create: `src/modules/app/spaces/hooks/useCalendarData.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/modules/app/spaces/hooks/useCalendarData.ts

import { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import type { EventInput } from '@fullcalendar/core';
import { Issue } from '../types/issue.type';
import { Sprint } from '../types/sprint.type';

function shiftDate(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), 'yyyy-MM-dd');
}

function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    Critical: '#ef4444',
    High:     '#f97316',
    Medium:   '#3b82f6',
    Low:      '#22c55e',
  };
  return map[priority] ?? '#6366f1';
}

export function useCalendarData(issues: Issue[], sprints: Sprint[]) {
  return useMemo(() => {
    const events: EventInput[] = [];
    const unscheduledTasks: Issue[] = [];

    for (const issue of issues) {
      if (!issue.startDate && !issue.endDate) {
        unscheduledTasks.push(issue);
        continue;
      }
      const start = issue.startDate ?? issue.endDate!;
      // FC uses exclusive end — add 1 day so the event renders on endDate
      const end = issue.endDate ? shiftDate(issue.endDate, 1) : undefined;
      const color = priorityColor(issue.priority);

      events.push({
        id: issue.id,
        title: issue.title,
        start,
        end,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { type: 'issue', rawData: issue },
      });
    }

    for (const sprint of sprints) {
      if (!sprint.startDate) continue;
      events.push({
        id: `sprint-${sprint.id}`,
        title: sprint.name,
        start: sprint.startDate,
        end: sprint.endDate ? shiftDate(sprint.endDate, 1) : undefined,
        allDay: true,
        editable: false,
        classNames: ['sprint-event'],
        backgroundColor: '#4f46e5',
        borderColor: '#4338ca',
        extendedProps: { type: 'sprint', rawData: sprint },
      });
    }

    return { events, unscheduledTasks };
  }, [issues, sprints]);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `useCalendarData.ts`. If there are FullCalendar type errors, ensure packages installed in Task 1.

- [ ] **Step 3: Commit**

```bash
git add src/modules/app/spaces/hooks/useCalendarData.ts
git commit -m "feat: add useCalendarData hook — maps issues/sprints to FC events"
```

---

## Task 5: Create `useCalendarHandlers` hook

**Files:**
- Create: `src/modules/app/spaces/hooks/useCalendarHandlers.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/modules/app/spaces/hooks/useCalendarHandlers.ts

import { format, subDays } from 'date-fns';
import type { EventDropArg, EventClickArg, EventReceiveArg } from '@fullcalendar/core';
import { Issue } from '../types/issue.type';

// EventResizeDoneArg is from @fullcalendar/interaction in v6
// Using 'any' for resize arg to avoid import resolution issues; shape is identical to EventDropArg
type EventResizeArg = {
  event: {
    id: string;
    start: Date | null;
    end: Date | null;
  };
};

interface UseCalendarHandlersProps {
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onSelectIssue: (issue: Issue | null) => void;
}

function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function useCalendarHandlers({ onUpdateIssueDate, onSelectIssue }: UseCalendarHandlersProps) {
  const onEventDrop = (arg: EventDropArg) => {
    const start = toDateStr(arg.event.start!);
    // FC end is exclusive — subtract 1 day to get the actual last day
    const end = arg.event.end ? toDateStr(subDays(arg.event.end, 1)) : start;
    onUpdateIssueDate(arg.event.id, start, end);
  };

  const onEventResize = (arg: EventResizeArg) => {
    const start = arg.event.start ? toDateStr(arg.event.start) : '';
    const end = arg.event.end ? toDateStr(subDays(arg.event.end, 1)) : start;
    if (start) onUpdateIssueDate(arg.event.id, start, end);
  };

  const onEventReceive = (arg: EventReceiveArg) => {
    const start = toDateStr(arg.event.start!);
    onUpdateIssueDate(arg.event.id, start, start);
    // Remove FC's internally created copy — React state drives rendering
    arg.event.remove();
  };

  const onEventClick = (arg: EventClickArg) => {
    if (arg.event.extendedProps.type === 'issue') {
      onSelectIssue(arg.event.extendedProps.rawData as Issue);
    }
  };

  return { onEventDrop, onEventResize, onEventReceive, onEventClick };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/app/spaces/hooks/useCalendarHandlers.ts
git commit -m "feat: add useCalendarHandlers — eventDrop/resize/receive/click"
```

---

## Task 6: Create `CalendarEventContent` component

**Files:**
- Create: `src/modules/app/common/components/CalendarEventContent.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/modules/app/common/components/CalendarEventContent.tsx
"use client";

import type { EventContentArg } from '@fullcalendar/core';
import { isAfter, parseISO } from 'date-fns';
import { Issue } from '@/modules/app/spaces/types/issue.type';

export default function CalendarEventContent({ eventInfo }: { eventInfo: EventContentArg }) {
  const { extendedProps, start, end } = eventInfo.event;

  // Sprint bar
  if (extendedProps.type === 'sprint') {
    return (
      <div className="flex items-center gap-1 px-1 w-full overflow-hidden">
        <span className="text-xs">⚡</span>
        <span className="text-xs text-white font-medium truncate">
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

  // Multi-day bar: end is set and spans more than 1 day
  const isMultiDay =
    end != null &&
    start != null &&
    end.getTime() - start.getTime() > 86_400_000;

  if (isMultiDay) {
    return (
      <div className="flex items-center px-1 w-full overflow-hidden">
        <span
          className={[
            'text-xs text-white truncate',
            isDone ? 'line-through opacity-60' : '',
            isOverdue ? 'text-red-200' : '',
          ].join(' ')}
        >
          {issue.title}
        </span>
      </div>
    );
  }

  // Single-day dot style
  return (
    <div className="flex items-center gap-1 px-0.5 w-full overflow-hidden">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: eventInfo.event.backgroundColor ?? '#6366f1' }}
      />
      <span
        className={[
          'text-xs truncate',
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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/app/common/components/CalendarEventContent.tsx
git commit -m "feat: add CalendarEventContent — dot/bar/done/overdue event styles"
```

---

## Task 7: Create `UnscheduledSidebar` component

**Files:**
- Create: `src/modules/app/common/components/UnscheduledSidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/modules/app/common/components/UnscheduledSidebar.tsx
"use client";

import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { X } from 'lucide-react';
import { Issue } from '@/modules/app/spaces/types/issue.type';

interface UnscheduledSidebarProps {
  tasks: Issue[];
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  High:     'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  Medium:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  Low:      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
};

export default function UnscheduledSidebar({ tasks, isOpen, onClose }: UnscheduledSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !isOpen) return;

    const draggable = new Draggable(containerRef.current, {
      itemSelector: '.draggable-task',
      eventData: (el: HTMLElement) => ({
        id: el.dataset.id!,
        title: el.dataset.title!,
        create: true,
      }),
    });

    return () => draggable.destroy();
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Unscheduled work
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} — drag to schedule
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-2xl">🎉</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All tasks are scheduled
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={[
                'draggable-task cursor-grab active:cursor-grabbing',
                'px-3 py-2.5 rounded-lg border text-sm select-none',
                'transition-shadow hover:shadow-md',
                PRIORITY_STYLES[task.priority] ??
                  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
              ].join(' ')}
              data-id={task.id}
              data-title={task.title}
            >
              <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {task.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {task.type} · {task.priority}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/app/common/components/UnscheduledSidebar.tsx
git commit -m "feat: add UnscheduledSidebar with FC external drag support"
```

---

## Task 8: Create `CalendarToolbar` component

**Files:**
- Create: `src/modules/app/common/components/CalendarToolbar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/modules/app/common/components/CalendarToolbar.tsx
"use client";

import { ChevronLeft, ChevronRight, AlignJustify } from 'lucide-react';
import type FullCalendar from '@fullcalendar/react';
import { CalendarFilters, CalendarViewType } from '@/modules/app/spaces/types/calendar.type';

interface CalendarToolbarProps {
  calendarRef: React.RefObject<FullCalendar>;
  currentDateTitle: string;
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  filters: CalendarFilters;
  onFiltersChange: (f: CalendarFilters) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  assignees: { id: string; color: string }[];
}

const SELECT_CLASS =
  'px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg ' +
  'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function CalendarToolbar({
  calendarRef,
  currentDateTitle,
  currentView,
  onViewChange,
  filters,
  onFiltersChange,
  isSidebarOpen,
  onToggleSidebar,
  assignees,
}: CalendarToolbarProps) {
  const api = () => calendarRef.current?.getApi();

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Row 1: Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className={`${SELECT_CLASS} w-44 placeholder-gray-400 dark:placeholder-gray-500`}
        />

        <select
          value={filters.assignees[0] ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, assignees: e.target.value ? [e.target.value] : [] })
          }
          className={SELECT_CLASS}
        >
          <option value="">All Assignees</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id}
            </option>
          ))}
        </select>

        <select
          value={filters.types[0] ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, types: e.target.value ? [e.target.value] : [] })
          }
          className={SELECT_CLASS}
        >
          <option value="">All Types</option>
          {['Task', 'Bug', 'Story', 'Epic'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filters.statuses[0] ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, statuses: e.target.value ? [e.target.value] : [] })
          }
          className={SELECT_CLASS}
        >
          <option value="">All Statuses</option>
          {['To Do', 'In Progress', 'Done'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Nav + View switch + Sidebar toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => api()?.today()}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => api()?.prev()}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => api()?.next()}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 min-w-[140px]">
            {currentDateTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Month / Week toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
            {(['dayGridMonth', 'dayGridWeek'] as CalendarViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-md transition-all',
                  currentView === view
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ].join(' ')}
              >
                {view === 'dayGridMonth' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>

          {/* Unscheduled sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            title="Unscheduled work"
            className={[
              'p-1.5 rounded-lg border transition-colors',
              isSidebarOpen
                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/app/common/components/CalendarToolbar.tsx
git commit -m "feat: add CalendarToolbar — 2-row nav/filter/view-switch toolbar"
```

---

## Task 9: Create `CalendarView` component

**Files:**
- Create: `src/modules/app/common/components/CalendarView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/modules/app/common/components/CalendarView.tsx
"use client";

import { useRef, useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import CalendarToolbar from './CalendarToolbar';
import UnscheduledSidebar from './UnscheduledSidebar';
import CalendarEventContent from './CalendarEventContent';

import { Issue } from '@/modules/app/spaces/types/issue.type';
import { Sprint } from '@/modules/app/spaces/types/sprint.type';
import { CalendarViewType, CalendarFilters } from '@/modules/app/spaces/types/calendar.type';
import { useCalendarData } from '@/modules/app/spaces/hooks/useCalendarData';
import { useCalendarHandlers } from '@/modules/app/spaces/hooks/useCalendarHandlers';
import { useAssignees } from '@/modules/app/spaces/hooks/useAssignees';

interface CalendarViewProps {
  issues: Issue[];
  sprints: Sprint[];
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  onSelectIssue: (issue: Issue | null) => void;
}

export default function CalendarView({
  issues,
  sprints,
  onUpdateIssueDate,
  onSelectIssue,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDateTitle, setCurrentDateTitle] = useState('');
  const [currentView, setCurrentView] = useState<CalendarViewType>('dayGridMonth');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    search: '',
    assignees: [],
    types: [],
    statuses: [],
  });

  // Apply calendar-local filters
  const filteredIssues = useMemo(
    () =>
      issues.filter((issue) => {
        if (
          filters.search &&
          !issue.title.toLowerCase().includes(filters.search.toLowerCase())
        )
          return false;
        if (filters.assignees.length && !filters.assignees.includes(issue.assignee))
          return false;
        if (filters.types.length && !filters.types.includes(issue.type))
          return false;
        if (filters.statuses.length && !filters.statuses.includes(issue.status))
          return false;
        return true;
      }),
    [issues, filters]
  );

  const { events, unscheduledTasks } = useCalendarData(filteredIssues, sprints);
  const handlers = useCalendarHandlers({ onUpdateIssueDate, onSelectIssue });
  const assignees = useAssignees(issues);

  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
  };

  return (
    <div className="flex h-full overflow-hidden gap-0">
      {/* Main calendar area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <CalendarToolbar
          calendarRef={calendarRef as React.RefObject<FullCalendar>}
          currentDateTitle={currentDateTitle}
          currentView={currentView}
          onViewChange={handleViewChange}
          filters={filters}
          onFiltersChange={setFilters}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          assignees={assignees}
        />

        <div className="flex-1 overflow-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            editable
            droppable
            eventContent={(arg) => <CalendarEventContent eventInfo={arg} />}
            eventDrop={handlers.onEventDrop}
            eventResize={handlers.onEventResize}
            eventReceive={handlers.onEventReceive}
            eventClick={handlers.onEventClick}
            datesSet={(arg) => setCurrentDateTitle(arg.view.title)}
            headerToolbar={false}
            height="auto"
          />
        </div>
      </div>

      {/* Unscheduled sidebar */}
      <UnscheduledSidebar
        tasks={unscheduledTasks}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify no TS errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in the new files. Ignore pre-existing errors if any.

- [ ] **Step 3: Commit**

```bash
git add src/modules/app/common/components/CalendarView.tsx
git commit -m "feat: add CalendarView — FullCalendar with toolbar, filters, DnD, sidebar"
```

---

## Task 10: Create `CalendarTab` wrapper

**Files:**
- Create: `src/modules/app/spaces/components/tabs/CalendarTab.tsx`

- [ ] **Step 1: Create the thin wrapper**

```tsx
// src/modules/app/spaces/components/tabs/CalendarTab.tsx
"use client";

import CalendarView from '@/modules/app/common/components/CalendarView';
import { Issue } from '@/modules/app/spaces/types/issue.type';
import { Sprint } from '@/modules/app/spaces/types/sprint.type';

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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/app/spaces/components/tabs/CalendarTab.tsx
git commit -m "feat: add CalendarTab thin wrapper"
```

---

## Task 11: Wire up Tabs, SpaceContent, and page

**Files:**
- Modify: `src/modules/app/spaces/components/common/Tabs.tsx`
- Modify: `src/modules/app/spaces/components/SpaceContent.tsx`
- Modify: `src/app/(app)/spaces/[id]/page.tsx`

### Step 1: Update `Tabs.tsx`

- [ ] Open `src/modules/app/spaces/components/common/Tabs.tsx`. After the `Tài liệu (Pages)` button (currently the last button), add a Calendar button. The new button should appear **before** the Pages button for a logical order.

Find this block in `Tabs.tsx`:
```tsx
      <button
        onClick={() => setActiveTab("timeline")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "timeline" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        Timeline
      </button>
```

After that block (before the List button), add:
```tsx
      <button
        onClick={() => setActiveTab("calendar")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "calendar" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        Calendar
      </button>
```

### Step 2: Update `SpaceContent.tsx`

- [ ] Open `src/modules/app/spaces/components/SpaceContent.tsx`.

**a) Add `calendarProps` to the props type.** Change the `SpaceContentProps` type:

```tsx
type SpaceContentProps = {
  activeTab: string;
  space: any;
  spaceId: string;
  boardProps: any;
  backlogProps: any;
  timelineProps: any;
  listProps: any;
  summaryProps: any;
  calendarProps: any;
};
```

**b) Add `calendarProps` to the destructured params** in the function signature:

```tsx
export default function SpaceContent({
  activeTab,
  space,
  spaceId,
  boardProps,
  backlogProps,
  timelineProps,
  listProps,
  summaryProps,
  calendarProps,
}: SpaceContentProps) {
```

**c) Add the import** at the top of the file (after existing imports):

```tsx
import CalendarTab from "./tabs/CalendarTab";
```

**d) Add the render block** — after `{activeTab === "timeline" && <TimelineTab {...timelineProps} />}`:

```tsx
      {activeTab === "calendar" && <CalendarTab {...calendarProps} />}
```

### Step 3: Update `spaces/[id]/page.tsx`

- [ ] Open `src/app/(app)/spaces/[id]/page.tsx`.

**a) Extend `activeTab` union type** (around line 47). Change:

```tsx
  const [activeTab, setActiveTab] = useState<
    "board" | "backlog" | "timeline" | "summary" | "pages" | "list"
  >("pages");
```

To:

```tsx
  const [activeTab, setActiveTab] = useState<
    "board" | "backlog" | "timeline" | "summary" | "pages" | "list" | "calendar"
  >("pages");
```

**b) Pass `calendarProps`** inside the `<SpaceContent>` component call. After the `summaryProps` prop, add:

```tsx
        calendarProps={{
          issues,
          sprints,
          handleUpdateIssueDate,
          setSelectedIssue,
        }}
```

- [ ] **Step 4: Commit all wiring**

```bash
git add src/modules/app/spaces/components/common/Tabs.tsx
git add src/modules/app/spaces/components/SpaceContent.tsx
git add "src/app/(app)/spaces/[id]/page.tsx"
git commit -m "feat: wire Calendar tab into Space page — Tabs, SpaceContent, page"
```

---

## Task 12: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open a Space and click "Calendar" tab**

Navigate to `http://localhost:3000/spaces/<any-id>` and click the new "Calendar" tab. Verify:

1. Calendar grid renders (month view)
2. Current month title shows in toolbar
3. Issues with `startDate`/`endDate` appear as colored bars on correct dates
4. Issues without dates do NOT appear on the calendar
5. Sprint bars appear as indigo bars

- [ ] **Step 3: Dark mode check**

Toggle dark mode (via the theme toggle in the topbar). Verify:

1. Calendar grid borders turn gray (`#374151`)
2. Day numbers turn light gray
3. Today's cell has blue tint
4. No white backgrounds visible anywhere in the calendar

- [ ] **Step 4: Toolbar nav check**

1. Click `<` — calendar navigates to previous month, title updates
2. Click `>` — next month
3. Click `Today` — returns to current month, today's cell is highlighted
4. Click `Week` — switches to week view, click `Month` to go back

- [ ] **Step 5: Sidebar check**

1. Click the ≡ (AlignJustify) button — Unscheduled Sidebar slides open showing tasks without dates
2. Calendar compresses to the left
3. Click X in sidebar — sidebar closes, calendar expands

- [ ] **Step 6: Drag from sidebar to calendar**

Drag a task card from the Unscheduled Sidebar and drop it on a date cell. Verify:

1. Task disappears from the sidebar
2. Task appears on the dropped date on the calendar
3. `console.log` (or check React state) — the issue now has `startDate` set

- [ ] **Step 7: Drag event on calendar**

Drag an existing event from one date to another on the calendar. Verify the event moves to the new date.

- [ ] **Step 8: Click event**

Click any event. Verify `TaskDetailDrawer` opens with the correct issue data.

- [ ] **Step 9: Final commit**

```bash
git add .
git commit -m "feat: complete calendar tab — fullcalendar, dark theme, drag-drop, unscheduled sidebar"
```

---

## Validation Checklist (from spec)

- [ ] Dark mode: all FC borders/backgrounds switch correctly, no white flash
- [ ] Today highlight: current day has blue tint in both light and dark
- [ ] Month ↔ Week view switch works via toolbar
- [ ] Drag event on calendar → eventDrop fires → local state updates
- [ ] Resize event bar → eventResize fires → endDate updates
- [ ] Drag from Sidebar → eventReceive fires → task leaves sidebar, appears on calendar
- [ ] Click event → TaskDetailDrawer opens with correct issue
- [ ] Sidebar toggle → calendar expands/collapses smoothly
- [ ] Sprint bars not draggable (editable: false)
- [ ] Done tasks show line-through, overdue tasks show red text
