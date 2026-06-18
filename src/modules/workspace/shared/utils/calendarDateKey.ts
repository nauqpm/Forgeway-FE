import { format } from "date-fns";

export function toCalendarDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
