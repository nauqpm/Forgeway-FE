import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("all workspace tabs share the full-height canvas shell", () => {
  const shell = read("src/modules/workspace/shared/components/WorkspaceTabShell.tsx");
  const page = read("src/modules/workspace/shared/components/WorkspacePage.tsx");
  const content = read("src/modules/workspace/shared/components/WorkspaceContent.tsx");
  const timelineTab = read("src/modules/workspace/board/TimelineTab.tsx");
  const timeline = read("src/modules/workspace/shared/components/TimelineView.tsx");
  const calendarTab = read("src/modules/workspace/board/CalendarTab.tsx");
  const list = read("src/modules/workspace/board/ListTab.tsx");
  const grid = read("src/modules/admin-shared/components/common/components/DataGridListView.tsx");

  assert.match(shell, /mode: "canvas" \| "content"/);
  assert.match(shell, /"flex min-h-0 min-w-0 flex-1 overflow-hidden p-\[var\(--workspace-surface-pad\)\]"/);
  assert.match(shell, /"flex-1 overflow-y-auto p-\[var\(--workspace-surface-pad\)\]"/);
  assert.match(page, /<WorkspaceTabShell mode="canvas">/);
  assert.match(page, /className="flex min-h-0 min-w-0 flex-1 flex-col"/);
  assert.doesNotMatch(page, /isCanvasTab/);
  assert.match(content, /className="flex min-h-0 min-w-0 flex-1"/);
  assert.doesNotMatch(content, /isCanvasTab/);
  assert.match(timelineTab, /className="flex min-h-0 min-w-0 flex-1 flex-col p-2"/);
  assert.match(timeline, /className="flex min-h-0 min-w-0 flex-1/);
  assert.match(calendarTab, /className="flex min-h-0 min-w-0 flex-1 flex-col p-2"/);
  assert.doesNotMatch(calendarTab, /workspace-board-height/);
  assert.match(list, /className="workspace-panel flex min-h-0 min-w-0 flex-1 flex-col/);
  assert.match(grid, /className="flex min-h-0 flex-1/);
});

test("former content tabs own their canvas scroll regions without clipping controls", () => {
  const backlog = read("src/modules/workspace/board/BacklogTab.tsx");
  const members = read("src/modules/workspace/board/MembersTab.tsx");
  const reports = read("src/modules/workspace/board/ReportsTab.tsx");
  const summary = read("src/modules/workspace/board/SummaryTab.tsx");
  const filterMenu = read("src/modules/workspace/shared/components/FilterMenu.tsx");

  assert.match(backlog, /className="flex min-h-0 min-w-0 flex-1 flex-col"/);
  assert.match(backlog, /<FilterMenu/);
  assert.match(filterMenu, /createPortal\(/);
  assert.match(filterMenu, /position: "fixed"/);
  assert.doesNotMatch(backlog, /workspace-surface max-w-\[min\(100%,72rem\)\]/);
  assert.match(members, /className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto/);
  for (const tab of [reports, summary]) {
    assert.match(tab, /className="flex min-h-0 min-w-0 flex-1 flex-col"/);
    assert.match(tab, /className="min-h-0 flex-1 overflow-y-auto/);
  }
});

test("board and archive reserve the remaining canvas height for data or its empty state", () => {
  const board = read("src/modules/workspace/board/BoardTab.tsx");
  const archive = read("src/modules/workspace/board/ArchiveTab.tsx");

  assert.match(board, /className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-0\.5"/);
  assert.match(board, /className="flex min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden"/);
  assert.match(archive, /className="workspace-panel flex min-h-0 flex-1 flex-col/);
  assert.match(archive, /className="relative flex min-h-0 flex-1 flex-col overflow-auto"/);
  assert.match(archive, /className="flex flex-1 flex-col items-center justify-center/);
});

test("board scrolls columns horizontally and task cards vertically within each column", () => {
  const board = read("src/modules/workspace/board/BoardTab.tsx");
  const columnHandlers = read("src/modules/workspace/shared/hooks/useColumnHandlers.ts");

  assert.match(board, /className="flex min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden"/);
  assert.match(board, /ref=\{columnsEndRef\}/);
  assert.match(board, /className="flex min-w-max pt-2 px-\[var\(--workspace-surface-pad\)\] pb-\[var\(--workspace-surface-pad\)\]"/);
  assert.match(board, /workspace-column flex min-h-0 flex-shrink-0/);
  assert.match(board, /className=\{`shrink-0 p-3 border-b/);
  assert.match(board, /className=\{`flex min-h-0 flex-1 flex-col overflow-y-auto p-3 space-y-3 transition-col/);
  assert.doesNotMatch(columnHandlers, /scrollIntoView/);
  assert.match(columnHandlers, /scrollContainer\.scrollTo/);
  assert.match(columnHandlers, /scrollContainer\.scrollWidth - scrollContainer\.clientWidth/);
});

test("board filter popover escapes the canvas overflow boundary", () => {
  const filters = read("src/modules/workspace/shared/components/BoardFilters.tsx");

  assert.match(filters, /import \{ createPortal \} from "react-dom"/);
  assert.match(filters, /createPortal\(/);
  assert.match(filters, /position: "fixed"/);
  assert.match(filters, /filterPopoverRef\.current\?\.contains/);
  assert.match(filters, /window\.addEventListener\("resize", updatePopoverPosition\)/);
  assert.match(filters, /max-w-\[calc\(100vw-1rem\)\]/);
  assert.match(filters, /Math\.min\(rect\.left, window\.innerWidth - popoverWidth - 8\)/);
});

test("timeline and list keep their own wide-data scroll context", () => {
  const timeline = read("src/modules/workspace/shared/components/TimelineView.tsx");
  const list = read("src/modules/workspace/board/ListTab.tsx");
  const grid = read("src/modules/admin-shared/components/common/components/DataGridListView.tsx");

  assert.match(timeline, /className="timeline-body-scroll flex-1 min-h-0 min-w-0 overflow-auto"/);
  assert.match(timeline, /headerRef\.current\) headerRef\.current\.scrollLeft = e\.currentTarget\.scrollLeft/);
  assert.match(timeline, /zoomAnchorDayRef/);
  assert.match(timeline, /const changeZoom/);
  assert.doesNotMatch(list, /className="flex-1 overflow-x-auto min-w-0"/);
  assert.match(list, /className="flex min-h-0 min-w-0 flex-1"/);
  assert.match(grid, /column\.id === 'key'/);
  assert.match(grid, /isPinned \? 'sticky z-20'/);
});
