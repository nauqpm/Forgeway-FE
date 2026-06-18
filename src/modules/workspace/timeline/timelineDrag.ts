import {
  addCalendarDays,
  dayOffsetFromPixels,
  getDateFromTimelineX,
  getTaskDurationDays,
  getXFromTimelineDate,
} from "./timelineDateMath";
import type { TimelineRow } from "./timelineRows";
import { getSprintDateBoundViolation } from "@/modules/workspace/shared/utils/sprintDateBounds";

export type TimelineMutationResult =
  | { type: "noop" }
  | { type: "blocked"; message: string }
  | {
      type: "move" | "resize";
      taskId: string;
      startDate: string;
      endDate: string;
    };

export interface TimelineDragSession {
  row: TimelineRow;
  startX: number;
  minMovePixels: number;
}

export interface TimelineResizeInput {
  row: TimelineRow;
  timelineStart: string;
  x: number;
  width: number;
  pixelsPerDay: number;
}

export interface TimelineBarGeometryInput {
  startDate: string;
  endDate: string;
  timelineStart: string;
  pixelsPerDay: number;
}

export interface TimelineBarGeometry {
  left: number;
  width: number;
}

export function getTimelineBarGeometry({
  startDate,
  endDate,
  timelineStart,
  pixelsPerDay,
}: TimelineBarGeometryInput): TimelineBarGeometry {
  return {
    left: getXFromTimelineDate(timelineStart, startDate, pixelsPerDay),
    width: Math.max(
      pixelsPerDay,
      getTaskDurationDays(startDate, endDate) * pixelsPerDay,
    ),
  };
}

export function calculateDragResult(
  session: TimelineDragSession,
  currentX: number,
  pixelsPerDay: number,
): TimelineMutationResult {
  const { row, startX, minMovePixels } = session;
  if (!row.canInteract) return { type: "noop" };

  const deltaX = currentX - startX;
  if (Math.abs(deltaX) < minMovePixels) return { type: "noop" };

  const movedDays = dayOffsetFromPixels(deltaX, pixelsPerDay);
  if (movedDays === 0) return { type: "noop" };

  const durationDays = getTaskDurationDays(row.startDate, row.endDate);
  const startDate = addCalendarDays(row.startDate, movedDays);
  const endDate = addCalendarDays(startDate, durationDays);
  const violation = getSprintDateBoundViolation(startDate, endDate, row);
  if (violation) {
    return {
      type: "blocked",
      message: violation,
    };
  }

  return {
    type: "move",
    taskId: row.originalId,
    startDate,
    endDate,
  };
}

export function calculateDragPreview(
  session: TimelineDragSession,
  currentX: number,
  pixelsPerDay: number,
): { startDate: string; endDate: string } | null {
  const result = calculateDragResult(session, currentX, pixelsPerDay);
  if (result.type !== "move") return null;
  return {
    startDate: result.startDate,
    endDate: result.endDate,
  };
}

export function calculateResizeResult({
  row,
  timelineStart,
  x,
  width,
  pixelsPerDay,
}: TimelineResizeInput): TimelineMutationResult {
  if (!row.canInteract) return { type: "noop" };

  const startDate = getDateFromTimelineX(timelineStart, x, pixelsPerDay);
  const durationDays = Math.max(1, dayOffsetFromPixels(width, pixelsPerDay));
  const endDate = addCalendarDays(startDate, durationDays);
  const violation = getSprintDateBoundViolation(startDate, endDate, row);
  if (violation) {
    return {
      type: "blocked",
      message: violation,
    };
  }

  if (startDate === row.startDate && endDate === row.endDate) {
    return { type: "noop" };
  }

  return {
    type: "resize",
    taskId: row.originalId,
    startDate,
    endDate,
  };
}
