# Calendar Tab — Design Spec

**Date:** 2026-05-15  
**Status:** Approved  
**Scope:** New "Calendar" tab inside Space page (`/spaces/[id]`)

---

## 1. Architecture & File Structure

Calendar follows the established tab pattern: thin wrapper in `spaces/components/tabs/`, reusable components in `common/components/` (same as `TimelineView`).

```
src/modules/app/common/components/
  CalendarView.tsx              # FullCalendar instance + dark CSS override
  CalendarToolbar.tsx           # 2-row toolbar: filters row + nav/view row
  UnscheduledSidebar.tsx        # Draggable task list panel (right side)
  CalendarEventContent.tsx      # Custom event renderer (dot vs bar, done/overdue styles)

src/modules/app/spaces/
  components/tabs/
    CalendarTab.tsx             # Thin wrapper — imports from common/
  hooks/
    useCalendarData.ts          # Maps issues/sprints → FC EventInput[] + unscheduledTasks[]
    useCalendarHandlers.ts      # eventDrop, eventResize, eventReceive, eventClick
  types/
    calendar.type.ts            # CalendarEvent, CalendarViewType interfaces
```

**Integration points (existing files modified):**
- `spaces/components/common/Tabs.tsx` — add "Calendar" button (all templates)
- `spaces/components/SpaceContent.tsx` — add `{activeTab === "calendar" && <CalendarTab .../>}`
- `app/(app)/spaces/[id]/page.tsx` — extend `activeTab` union + pass `calendarProps`
- `src/app/globals.css` — add FullCalendar dark theme CSS overrides

---

## 2. Data Flow & Event Mapping

### Issue → FullCalendar EventInput mapping

| Issue state | FC event | Rendered as |
|---|---|---|
| Has `startDate` + `endDate` | `start=startDate`, `end=endDate+1day` | Multi-day bar |
| Has `startDate` only | `start=startDate`, `end=startDate` | Single-day dot |
| Has `endDate` only | `start=endDate`, `end=endDate` | Single-day dot |
| No dates | Not mapped to FC | Added to `unscheduledTasks[]` |
| Sprint object | `allDay:true`, `editable:false`, `classNames:['sprint-event']` | Indigo bar, non-draggable |

**Note:** FullCalendar uses exclusive end dates. Always add +1 day when mapping `endDate` into FC, subtract -1 day when reading back from FC callbacks.

**Extended props** (required on every event for type-safe handlers):
```ts
extendedProps: {
  type: 'issue' | 'sprint',
  rawData: Issue | Sprint,
}
```

### `useCalendarData.ts`

**Inputs:** `issues: Issue[]`, `sprints: Sprint[]`  
**Output:**
```ts
{
  events: EventInput[],        // fed into FullCalendar `events` prop
  unscheduledTasks: Issue[],   // fed into UnscheduledSidebar
}
```

### `useCalendarHandlers.ts` — 4 callbacks

| Callback | Trigger | Action |
|---|---|---|
| `eventDrop` | Drag event to new day on calendar | Read `event.start` / `event.end` (subtract 1 from end) → optimistic update → API PATCH |
| `eventResize` | Drag edge of bar to change end date | Read new `event.end` (subtract 1) → optimistic update `endDate` → API PATCH |
| `eventReceive` | Drop from Sidebar onto calendar | Set `startDate` = drop date → remove from `unscheduledTasks[]` → API PATCH |
| `eventClick` | Click event on calendar | Read `extendedProps.type`; if `'issue'` → call `setSelectedIssue(rawData)` → opens existing `TaskDetailDrawer` |

**State source of truth:** `issues` state in `spaces/[id]/page.tsx` (already used by Board/Timeline/List).  
**Optimistic update:** Reuse `handleUpdateIssueDate` from existing `useIssueHandlers`.

**External drag setup (`UnscheduledSidebar`):**  
`useEffect` in `UnscheduledSidebar` initializes `new Draggable(containerRef.current, { itemSelector: '.draggable-task', eventData: (el) => ({ id: el.dataset.id, title: el.dataset.title, create: true }) })` from `@fullcalendar/interaction`. Destroy on unmount.  
`isSidebarOpen` boolean state lives in `CalendarView.tsx` (local state), not in the page.

**API call on drop/resize:**
```
PATCH /tasks/:id   body: { startDate: string | null, endDate: string | null }
```

---

## 3. UI, Dark Theme & Toolbar

### CalendarToolbar — 2-row layout

```
Row 1: [Search Input] [Assignee Filter] [Type Filter] [Status Filter]
Row 2: [Today] [<] [May 2026] [>]                    [Month ▾] [≡ Unscheduled]
```

- Navigation calls `calendarRef.current.getApi().prev()` / `.next()` / `.today()`
- Current date title sourced from FullCalendar `datesSet` prop: `datesSet={(arg) => setCurrentDateTitle(arg.view.title)}`
- View switch calls `calendarRef.current.getApi().changeView('dayGridMonth' | 'dayGridWeek')`
- Sidebar toggle button sets `isSidebarOpen` boolean state

### Dark Theme — CSS custom properties in `globals.css`

```css
/* Hide FC default toolbar — using custom CalendarToolbar */
.fc .fc-toolbar.fc-header-toolbar { display: none; }

/* Light mode */
.fc { --fc-border-color: #e5e7eb; --fc-page-bg-color: transparent; }
.fc .fc-day-today { background-color: rgba(99, 102, 241, 0.05) !important; }

/* Dark mode */
.dark .fc {
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #1f2937;
  --fc-border-color: #374151;
  color: #f3f4f6;
}
.dark .fc .fc-day-today { background-color: rgba(59, 130, 246, 0.1) !important; }
.dark .fc .fc-daygrid-day-number { color: #d1d5db; }
.dark .fc .fc-col-header-cell-cushion { color: #9ca3af; }
```

### `CalendarEventContent.tsx` — event rendering rules

| Event type | Visual |
|---|---|
| Sprint bar | Indigo background, `SPRINT: name`, no close button |
| Multi-day issue bar | Blue/violet bg, rounded, title truncated |
| Single-day issue | Icon (Bug/Story/Task) + title, no background |
| Done issue (any type) | Title with `line-through` |
| Overdue issue | Title/dot in `text-red-500` |

### Sidebar layout

```tsx
<div className="flex h-full overflow-hidden">
  <div className="flex-1 transition-all duration-300 min-w-0">
    {/* CalendarView */}
  </div>
  <div className={`w-80 border-l transition-all duration-300 dark:border-gray-700
    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full hidden'}`}>
    {/* UnscheduledSidebar */}
  </div>
</div>
```

`flex-1` on the calendar means it auto-shrinks when sidebar opens — no `calc()` needed.

---

## 4. Dependencies, API & Integration

### New npm packages (4)
```
@fullcalendar/react
@fullcalendar/daygrid
@fullcalendar/interaction
@fullcalendar/core          # peer dep
```

### `apiRoutes.ts` — add 1 route
```ts
TASKS: {
  ...existing,
  UPDATE: (id: string) => `/tasks/${id}`,
}
```

### Files modified (existing)
| File | Change |
|---|---|
| `spaces/components/common/Tabs.tsx` | Add Calendar button (no template guard) |
| `spaces/components/SpaceContent.tsx` | Add `{activeTab === "calendar" && <CalendarTab .../>}` |
| `app/(app)/spaces/[id]/page.tsx` | Extend activeTab union + add calendarProps |
| `src/config/apiRoutes.ts` | Add `TASKS.UPDATE` |
| `src/app/globals.css` | Add FC dark theme overrides |

### `calendarProps` passed to CalendarTab
```ts
{
  filteredIssues: Issue[],
  sprints: Sprint[],
  handleUpdateIssueDate: (id: string, startDate: string, endDate: string) => void,
  setSelectedIssue: (issue: Issue | null) => void,
}
```
Same shape as `timelineProps` — no new state needed in the page.

---

## Validation Checklist

- [ ] Dark mode: all FC borders/backgrounds switch correctly, no white flash
- [ ] Today highlight: current day has blue tint in both light and dark
- [ ] Month ↔ Week view switch works via toolbar dropdown
- [ ] Drag event on calendar → `eventDrop` fires → local state updates → API called
- [ ] Resize event bar → `eventResize` fires → endDate updates
- [ ] Drag from Unscheduled Sidebar → `eventReceive` fires → task leaves sidebar, appears on calendar
- [ ] Click event → `TaskDetailDrawer` opens with correct issue data
- [ ] Sidebar toggle → calendar expands/collapses smoothly
- [ ] Sprint bars are not draggable (`editable: false`)
- [ ] Done tasks show `line-through`, overdue tasks show red text
