import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

export const DATE_FORMAT = "yyyy-MM-dd";

export function toDateKey(value: string | Date): string {
  if (value instanceof Date) return format(value, DATE_FORMAT);
  return value.split("T")[0] || value;
}

export function addCalendarDays(dateKey: string, days: number): string {
  return format(addDays(parseISO(toDateKey(dateKey)), days), DATE_FORMAT);
}

export function daysBetween(startDate: string, endDate: string): number {
  return differenceInCalendarDays(
    parseISO(toDateKey(endDate)),
    parseISO(toDateKey(startDate)),
  );
}

export function dayOffsetFromPixels(x: number, pixelsPerDay: number): number {
  if (pixelsPerDay <= 0) return 0;
  return Math.round(x / pixelsPerDay);
}

export function pixelsFromDayOffset(days: number, pixelsPerDay: number): number {
  return days * pixelsPerDay;
}

export function getTaskDurationDays(startDate: string, endDate: string): number {
  return Math.max(1, daysBetween(startDate, endDate));
}

export function getDateFromTimelineX(
  timelineStart: string,
  x: number,
  pixelsPerDay: number,
): string {
  return addCalendarDays(timelineStart, dayOffsetFromPixels(x, pixelsPerDay));
}

export function getXFromTimelineDate(
  timelineStart: string,
  dateKey: string,
  pixelsPerDay: number,
): number {
  return pixelsFromDayOffset(daysBetween(timelineStart, dateKey), pixelsPerDay);
}

export type WeeklyBoundaryOffset = {
  dateKey: string;
  left: number;
};

export function getWeeklyBoundaryOffsets({
  timelineStart,
  totalDays,
  pixelsPerDay,
}: {
  timelineStart: string;
  totalDays: number;
  pixelsPerDay: number;
}): WeeklyBoundaryOffset[] {
  const start = parseISO(toDateKey(timelineStart));
  const boundaries: WeeklyBoundaryOffset[] = [];

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const date = addDays(start, dayIndex);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    if (format(date, DATE_FORMAT) !== format(weekStart, DATE_FORMAT)) continue;

    boundaries.push({
      dateKey: format(date, DATE_FORMAT),
      left: pixelsFromDayOffset(dayIndex, pixelsPerDay),
    });
  }

  return boundaries;
}
