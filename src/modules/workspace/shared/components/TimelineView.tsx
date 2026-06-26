"use client";

import React, {
  useState, useMemo, useRef, useCallback, useEffect,
} from 'react';
import { Rnd } from 'react-rnd';
import {
  addDays, format, eachDayOfInterval, isToday, parseISO,
} from 'date-fns';
import { ZoomIn, ZoomOut, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  calculateDragPreview,
  calculateDragResult,
  calculateResizeResult,
  getTimelineBarGeometry,
  type TimelineDragSession,
} from '@/modules/workspace/timeline/timelineDrag';
import { getWeeklyBoundaryOffsets } from '@/modules/workspace/timeline/timelineDateMath';
import {
  buildTimelineRows,
  type TimelineRow,
} from '@/modules/workspace/timeline/timelineRows';

/* ─────────────────────────────── Types ──────────────────────────────────── */

interface TimelineViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issues: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sprints: any[];
  dependencies?: TaskDependency[];
  onUpdateIssueDate: (id: string, start: string, end: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClickTask?: (issue: any) => void;
  onCreateDependency?: (fromTaskId: string, toTaskId: string) => void;
  canMoveTask?: boolean;
}

type TaskDependency = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type?: string;
};

/* ──────────────────────────── Constants ─────────────────────────────────── */

const isMobile = typeof window !== "undefined" && window.innerWidth < 480;

const ROW_H        = 46;
const VIRT_BUF     = 6;
const DATE_PAD     = 7;
const LABEL_W = isMobile ? 140 : 248;
const MIN_DRAG_PIXELS = 10;
const TIMELINE_HEADER_H = 56;
const SPRINT_TRACK_H = 42;
const TASK_LABEL_MIN_W = 72;
const SPRINT_LABEL_MIN_W = 96;

type HoverTooltip = {
  text: string;
  x: number;
  y: number;
} | null;

/* ────────────────────────────── Helpers ─────────────────────────────────── */

/* ═══════════════════════════ Component ══════════════════════════════════════ */

export default function TimelineView({
  issues,
  sprints,
  dependencies = [],
  onUpdateIssueDate,
  onClickTask,
  onCreateDependency,
  canMoveTask = true,
}: TimelineViewProps) {
  const [pixelsPerDay, setPixelsPerDay] = useState(40);
  const [collapsed,    setCollapsed]    = useState<Set<string>>(new Set());
  const [tooltip,      setTooltip]      = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltip>(null);
  const [containerH,   setContainerH]   = useState(600);
  const [scrollTop,    setScrollTop]    = useState(0);

  const bodyRef       = useRef<HTMLDivElement>(null);
  const leftRef       = useRef<HTMLDivElement>(null);
  const syncingRef    = useRef(false);
  const dragSessionRef = useRef<TimelineDragSession | null>(null);
  const suppressNextTaskClickRef = useRef(false);

  /* ── Measure container height ────────────────────────────────────── */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setContainerH(el.clientHeight);
    const ro = new ResizeObserver(() => setContainerH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Build flat ordered row list ────────────────────────────────── */
  const rows = useMemo<TimelineRow[]>(() => {
    return buildTimelineRows({ issues, sprints, collapsed, canMoveTask });
  }, [issues, sprints, collapsed, canMoveTask]);

  const scheduledSprints = useMemo(
    () =>
      sprints
        .map((sprint) => ({
          id: sprint.id ?? sprint._id,
          title: sprint.name,
          status: sprint.status,
          startDate: sprint.startDate?.split('T')[0],
          endDate: sprint.endDate?.split('T')[0],
        }))
        .filter((sprint) => sprint.id && sprint.startDate && sprint.endDate),
    [sprints],
  );
  const visibleSprintTrackItems = useMemo(
    () => scheduledSprints.filter((sprint) => sprint.status !== 'completed'),
    [scheduledSprints],
  );

  /* ── Timeline date range ─────────────────────────────────────────── */
  const { minDate, daysArray, totalWidth } = useMemo(() => {
    // Use parseISO so sentinel is midnight UTC — consistent with task date strings
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let min: Date | null = null;
    let max: Date | null = null;
    for (const r of rows) {
      if (!r.startDate || !r.endDate) continue;
      const s = parseISO(r.startDate), e = parseISO(r.endDate);
      if (!min || s < min) min = s;
      if (!max || e > max) max = e;
    }
    for (const sprint of visibleSprintTrackItems) {
      if (!sprint.startDate || !sprint.endDate) continue;
      const s = parseISO(sprint.startDate), e = parseISO(sprint.endDate);
      if (!min || s < min) min = s;
      if (!max || e > max) max = e;
    }
    min = addDays(min ?? parseISO(todayStr), -DATE_PAD);
    max = addDays(max ?? parseISO(todayStr), DATE_PAD * 4);
    const days = eachDayOfInterval({ start: min, end: max });
    return { minDate: min, daysArray: days, totalWidth: days.length * pixelsPerDay };
  }, [rows, visibleSprintTrackItems, pixelsPerDay]);

  const timelineStart = useMemo(() => format(minDate, 'yyyy-MM-dd'), [minDate]);
  const totalListH = rows.length * ROW_H;
  const hasSprintTrack = visibleSprintTrackItems.length > 0;

  const weeklyBoundaries = useMemo(
    () =>
      getWeeklyBoundaryOffsets({
        timelineStart,
        totalDays: daysArray.length,
        pixelsPerDay,
      }),
    [timelineStart, daysArray.length, pixelsPerDay],
  );
  const weeklyBoundaryKeys = useMemo(
    () => new Set(weeklyBoundaries.map((boundary) => boundary.dateKey)),
    [weeklyBoundaries],
  );

  /* ── Virtual window ──────────────────────────────────────────────── */
  const visStart    = Math.max(0, Math.floor(scrollTop / ROW_H) - VIRT_BUF);
  const visEnd      = Math.min(rows.length - 1, Math.ceil((scrollTop + containerH) / ROW_H) + VIRT_BUF);
  const visibleRows = rows.slice(visStart, visEnd + 1);

  /* ── originalId → row index (for dependency arrows) ─────────────── */
  const rowIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r, i) => m.set(r.originalId, i));
    return m;
  }, [rows]);

  /* ── Bar geometry ────────────────────────────────────────────────── */
  const getGeometry = useCallback(
    (startDate: string, endDate: string) =>
      getTimelineBarGeometry({
        startDate,
        endDate,
        timelineStart,
        pixelsPerDay,
      }),
    [pixelsPerDay, timelineStart],
  );

  /* ── Dependency SVG paths (whole-canvas coords — scroll naturally) ─ */
  const depPaths = useMemo(() => {
    return dependencies.flatMap(dep => {
      const fromIdx = rowIndexMap.get(dep.fromTaskId);
      const toIdx   = rowIndexMap.get(dep.toTaskId);
      if (fromIdx === undefined || toIdx === undefined) return [];

      const fromRow = rows[fromIdx];
      const toRow   = rows[toIdx];
      if (!fromRow?.endDate || !toRow?.startDate) return [];

      const fromGeometry = getGeometry(fromRow.startDate, fromRow.endDate);
      const toGeometry = getGeometry(toRow.startDate, toRow.endDate);
      const x1 = fromGeometry.left + fromGeometry.width;
      const y1 = fromIdx * ROW_H + ROW_H / 2;
      const x2 = toGeometry.left;
      const y2 = toIdx   * ROW_H + ROW_H / 2;
      const cx = (x1 + x2) / 2;

      return [{
        id:     dep.id,
        path:   `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`,
        dashed: dep.type === 'relates_to',
      }];
    });
  }, [dependencies, rowIndexMap, rows, getGeometry]);

  /* ── Scroll sync (left follows right, flag prevents loop) ─────────── */
  const handleBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    setScrollTop(st);
    if (!syncingRef.current && leftRef.current) {
      syncingRef.current = true;
      leftRef.current.scrollTop = st;
      syncingRef.current = false;
    }
  }, []);

  const handleLeftScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    setScrollTop(st);
    if (!syncingRef.current && bodyRef.current) {
      syncingRef.current = true;
      bodyRef.current.scrollTop = st;
      syncingRef.current = false;
    }
  }, []);

  /* ── Drag / Resize callbacks ─────────────────────────────────────── */
  const onDragStop = useCallback((row: TimelineRow, x: number) => {
    setTooltip(null);
    const session = dragSessionRef.current;
    dragSessionRef.current = null;
    if (!session) return;

    const result = calculateDragResult(session, x, pixelsPerDay);
    if (result.type === 'noop') return;
    suppressNextTaskClickRef.current = true;
    if (result.type === 'blocked') {
      toast.error(result.message);
      return;
    }

    onUpdateIssueDate(result.taskId, result.startDate, result.endDate);
  }, [pixelsPerDay, onUpdateIssueDate]);

  const onResizeStop = useCallback((row: TimelineRow, x: number, w: number) => {
    setTooltip(null);
    const result = calculateResizeResult({
      row,
      timelineStart,
      x,
      width: w,
      pixelsPerDay,
    });
    if (result.type === 'noop') return;
    suppressNextTaskClickRef.current = true;
    if (result.type === 'blocked') {
      toast.error(result.message);
      return;
    }

    onUpdateIssueDate(result.taskId, result.startDate, result.endDate);
  }, [pixelsPerDay, timelineStart, onUpdateIssueDate]);

  const onDrag = useCallback((row: TimelineRow, x: number) => {
    const session = dragSessionRef.current;
    if (!session) return;
    const preview = calculateDragPreview(session, x, pixelsPerDay);
    if (!preview) {
      setTooltip(null);
      return;
    }
    setTooltip(
      `${format(parseISO(preview.startDate), 'MMM d')} – ${format(parseISO(preview.endDate), 'MMM d')}`,
    );
  }, [pixelsPerDay]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }, []);

  const formatRangeTooltip = useCallback(
    (title: string, startDate: string, endDate: string) =>
      `${title} (${format(parseISO(startDate), 'yyyy/MM/dd')} - ${format(parseISO(endDate), 'yyyy/MM/dd')})`,
    [],
  );

  const handleHoverMove = useCallback(
    (event: React.MouseEvent, title: string, startDate: string, endDate: string) => {
      setHoverTooltip({
        text: formatRangeTooltip(title, startDate, endDate),
        x: event.clientX + 12,
        y: event.clientY + 12,
      });
    },
    [formatRangeTooltip],
  );

  const clearHoverTooltip = useCallback(() => setHoverTooltip(null), []);

  const renderWeeklyBoundaryGrid = (height: number) => (
    <div className="absolute inset-0 pointer-events-none">
      {weeklyBoundaries.map((boundary) => (
        <div
          key={boundary.dateKey}
          className="absolute top-0 w-px bg-[#EAEAEA] dark:bg-[#2A2A2A]"
          style={{ left: boundary.left, height }}
        />
      ))}
    </div>
  );

  const renderSprintOverlay = () => (
    <div
      className="relative h-[2.625rem] shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]"
      style={{ width: totalWidth, minWidth: totalWidth }}
    >
      {renderWeeklyBoundaryGrid(SPRINT_TRACK_H)}

      {visibleSprintTrackItems.map((sprint) => {
        const { left, width } = getGeometry(sprint.startDate!, sprint.endDate!);
        const showLabel = width >= SPRINT_LABEL_MIN_W;
        const hasPastOverflow = left < 2;

        return (
          <div
            key={sprint.id}
            className="absolute top-2 h-7 rounded-[4px] border border-[#2563EB]/40 bg-[#EFF6FF]/80 px-3 text-[0.6875rem] font-semibold leading-7 text-[#1F6C9F] transition-colors hover:border-[#2563EB]/60 hover:bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)] dark:text-[#93C5FD]"
            style={{ left, width }}
            onMouseMove={(event) => handleHoverMove(event, sprint.title, sprint.startDate!, sprint.endDate!)}
            onMouseLeave={clearHoverTooltip}
          >
            {hasPastOverflow && (
              <span className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-[#2563EB]/40 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)]" />
            )}
            {showLabel && <span className="relative block truncate">{sprint.title}</span>}
          </div>
        );
      })}
    </div>
  );

  /* ── Left panel row ──────────────────────────────────────────────── */
  const renderLeftCell = (row: TimelineRow, globalIdx: number) => {
    const isSection  = row.kind !== 'task';
    const isCollapsed = collapsed.has(row.id);

    return (
      <div
        key={row.id}
        style={{ position: 'absolute', top: globalIdx * ROW_H, left: 0, right: 0, height: ROW_H }}
        className={`flex items-center border-b border-[#EAEAEA] dark:border-white/[0.04] px-3 gap-2 select-none
          ${isSection
            ? 'bg-[#F9F9F8]/60 dark:bg-[rgba(255,255,255,0.02)]'
            : 'hover:bg-[#F7F6F3] dark:hover:bg-white/5 cursor-pointer'}`}
        onClick={() => !isSection && onClickTask?.(row.meta)}
      >
        {/* Indentation */}
        <div style={{ width: row.indent * 16, flexShrink: 0 }} />

        {/* Collapse toggle or dot indicator */}
        {isSection ? (
          <button
            onClick={e => { e.stopPropagation(); toggleCollapse(row.id); }}
            className="shrink-0 p-0.5 rounded-[3px] text-[#ABABAB] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
          >
            {isCollapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronDown  className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span
            className="w-2 h-2 shrink-0 rounded-full"
            style={{ background: row.barColor }}
          />
        )}

        <span className={`text-[0.6875rem] truncate leading-none
          ${row.kind === 'sprint'  ? 'font-semibold text-[#2563EB] dark:text-[#3B82F6]' : ''}
          ${row.kind === 'epic'    ? 'font-semibold text-[#6D28D9] dark:text-[#A78BFA]' : ''}
          ${row.kind === 'section' ? 'font-bold uppercase tracking-wider text-[0.625rem] text-[#ABABAB] dark:text-[#6B6B6B]' : ''}
          ${row.kind === 'task'    ? 'text-[#111111] dark:text-[#E8E8E7]' : ''}
        `}>
          {row.title}
        </span>
      </div>
    );
  };

  /* ── Right panel bar row ─────────────────────────────────────────── */
  const renderBarCell = (row: TimelineRow, globalIdx: number) => {
    const { left, width } = getGeometry(row.startDate, row.endDate);
    const isInteractiveTask = row.kind === 'task' && row.canInteract;

    return (
      <div
        key={row.id}
        style={{ position: 'absolute', top: globalIdx * ROW_H, left: 0, width: totalWidth, height: ROW_H }}
        className="border-b border-[#EAEAEA] dark:border-white/[0.04]"
        onMouseMove={(event) => handleHoverMove(event, row.title, row.startDate, row.endDate)}
        onMouseLeave={clearHoverTooltip}
      >
        {row.kind === 'task' ? (
          <Rnd
            bounds="parent"
            dragAxis="x"
            enableResizing={{
              left: isInteractiveTask, right: isInteractiveTask,
              top: false, bottom: false,
              topRight: false, bottomRight: false, bottomLeft: false, topLeft: false,
            }}
            disableDragging={!isInteractiveTask}
            position={{ x: left, y: 8 }}
            size={{ width, height: 32 }}
            minWidth={pixelsPerDay}
            onDragStart={(_, d) => {
              dragSessionRef.current = {
                row,
                startX: d.x,
                minMovePixels: MIN_DRAG_PIXELS,
              };
            }}
            onDrag={(_, d) => onDrag(row, d.x)}
            onDragStop={(_, d) => onDragStop(row, d.x)}
            onResizeStop={(_, __, ref, ___, pos) => onResizeStop(row, pos.x, ref.offsetWidth)}
            onClick={(event: React.MouseEvent) => {
              if (suppressNextTaskClickRef.current) {
                suppressNextTaskClickRef.current = false;
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              if (row.meta) onClickTask?.(row.meta);
            }}
            className={`group rounded-[6px] flex items-center px-2.5 text-white text-xs font-semibold overflow-visible select-none hover:brightness-110 transition-[filter] relative ${
              isInteractiveTask ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
            }`}
            style={{ background: row.barColor, boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
          >
            {width >= TASK_LABEL_MIN_W ? (
              <span className="truncate">{row.title}</span>
            ) : (
              <span className="sr-only">{row.title}</span>
            )}
            {width < TASK_LABEL_MIN_W && (
              <span className="pointer-events-none absolute right-full top-1/2 z-30 mr-2 hidden max-w-[16.25rem] -translate-y-1/2 whitespace-nowrap rounded-[4px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-2 py-1 text-xs font-semibold text-[#111111] dark:text-[#E8E8E7] group-hover:block" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                {row.title}
              </span>
            )}

            {/* Dependency connector dot — right edge */}
            {onCreateDependency && (
              <div
                title="Drag to link dependency"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2 bg-white z-10 cursor-crosshair"
                style={{ borderColor: row.barColor }}
                onMouseDown={e => e.stopPropagation()}
              />
            )}
          </Rnd>
        ) : (
          <div
            className={`absolute pointer-events-none ${
              row.kind === 'sprint'
                ? 'rounded-[6px] px-3 py-1 text-[0.6875rem] font-semibold text-white'
                : 'rounded opacity-20'
            }`}
            style={{
              left,
              width,
              top: row.kind === 'sprint' ? 9 : 12,
              height: row.kind === 'sprint' ? 30 : 24,
              background: row.barColor,
              boxShadow: row.kind === 'sprint' ? "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" : undefined,
            }}
          >
            {row.kind === 'sprint' && (
              <span className="block truncate leading-5">
                {row.title} · {row.startDate} - {row.endDate}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="workspace-list-height bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden flex flex-col font-sans text-[#111111] dark:text-[#E8E8E7] relative">
      <div className="flex flex-1 min-h-0 ">

        {/* ────────── LEFT PANEL ────────── */}
        <div
          style={{ width: LABEL_W, flexShrink: 0 }}
          className="border-r border-[#EAEAEA] dark:border-white/[0.06] flex flex-col bg-white dark:bg-[#202020] z-10 w-[140px] md:w-[248px]"
        >
          {/* Header */}
          <div
            className="border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] flex items-center px-3 shrink-0 gap-2"
            style={{ height: TIMELINE_HEADER_H }}
          >
            <span className="font-semibold text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Work Items</span>
            <span className="ml-auto text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] tabular-nums">{rows.length}</span>
          </div>
          {hasSprintTrack && (
          <div
            className="flex shrink-0 items-center border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-3 text-[0.625rem] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6]"
            style={{ height: SPRINT_TRACK_H }}
          >
            Sprints
          </div>
          )}

          {/* Virtual body */}
          <div
            ref={leftRef}
            onScroll={handleLeftScroll}
            className="flex-1 min-h-0 overflow-y-scroll"
            style={{ scrollbarWidth: 'none' }}
          >
            <div style={{ height: totalListH, position: 'relative' }}>
              {visibleRows.map((row, li) => renderLeftCell(row, visStart + li))}
            </div>
          </div>
        </div>

        {/* ────────── RIGHT PANEL ────────── */}
        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-[#202020] overflow-hidden">

          {/* Date header */}
          <div
            className="shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] flex"
            style={{ width: totalWidth, minWidth: totalWidth, height: TIMELINE_HEADER_H }}
          >
            {daysArray.map((day, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center justify-end pb-1 relative"
                style={{ width: pixelsPerDay }}
              >
                {weeklyBoundaryKeys.has(format(day, 'yyyy-MM-dd')) && (
                  <span className="absolute left-0 top-0 h-full w-px bg-[#EAEAEA] dark:bg-[#2A2A2A]" />
                )}
                {(day.getDate() === 1 || i === 0) && (
                  <span className="absolute top-1.5 left-1.5 text-[0.5625rem] font-bold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider whitespace-nowrap">
                    {format(day, 'MMM yy')}
                  </span>
                )}
                <span className={`text-[0.625rem] font-medium
                  ${isToday(day)
                    ? 'text-[#2563EB] dark:text-[#3B82F6] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.15)] px-1 rounded-[3px]'
                    : 'text-[#ABABAB] dark:text-[#6B6B6B]'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          {hasSprintTrack && renderSprintOverlay()}

          {/* Scrollable body */}
          <div
            ref={bodyRef}
            onScroll={handleBodyScroll}
            className="flex-1 min-h-0 overflow-auto overflow-x-auto"
            style={{ width: totalWidth }}
          >
            <div style={{ height: totalListH, position: 'relative', width: totalWidth }}>

              {renderWeeklyBoundaryGrid(totalListH)}

              {/* Dependency arrows — full-canvas SVG, scrolls with content */}
              {depPaths.length > 0 && (
                <svg
                  className="absolute inset-0 pointer-events-none z-20 overflow-visible"
                  style={{ width: totalWidth, height: totalListH }}
                >
                  <defs>
                    <marker
                      id="tl-arrow"
                      markerWidth="8" markerHeight="8"
                      refX="7" refY="4"
                      orient="auto"
                    >
                      <path d="M 0 1 L 7 4 L 0 7 Z" fill="#ABABAB" />
                    </marker>
                  </defs>

                  {depPaths.map(({ id, path, dashed }) => (
                    <path
                      key={id}
                      d={path}
                      fill="none"
                      stroke="#ABABAB"
                      strokeWidth={1.5}
                      strokeOpacity={0.55}
                      strokeDasharray={dashed ? '5 3' : undefined}
                      markerEnd="url(#tl-arrow)"
                    />
                  ))}
                </svg>
              )}

              {/* Virtual task bars */}
              <div className="relative z-10">
                {visibleRows.map((row, li) => renderBarCell(row, visStart + li))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-5 right-5 z-40 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] flex items-center p-1 gap-0.5" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <button
          onClick={() => setPixelsPerDay(p => Math.max(10, p - 10))}
          className="p-1.5 text-[#787774] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[0.6875rem] font-mono px-2 text-[#787774] dark:text-[#9B9A97] tabular-nums">
          {pixelsPerDay}px
        </span>
        <button
          onClick={() => setPixelsPerDay(p => Math.min(100, p + 10))}
          className="p-1.5 text-[#787774] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[4px] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Drag date tooltip */}
      {tooltip && (
        <div className="fixed bottom-16 right-8 z-50 bg-[#111111] text-white text-[0.6875rem] px-3 py-1.5 rounded-[4px] pointer-events-none font-mono" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {tooltip}
        </div>
      )}

      {hoverTooltip && (
        <div
          className="fixed z-50 rounded-[4px] border border-white/10 bg-[#111111] px-2.5 py-1.5 text-[0.6875rem] font-medium text-white pointer-events-none"
          style={{ left: hoverTooltip.x, top: hoverTooltip.y, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {hoverTooltip.text}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .timeline-body-scroll::-webkit-scrollbar { width: 5px; }
        .timeline-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .timeline-body-scroll::-webkit-scrollbar-thumb { background: #EAEAEA; border-radius: 3px; }
        .timeline-body-scroll::-webkit-scrollbar-thumb:hover { background: #ABABAB; }
      ` }} />
    </div>
  );
}
