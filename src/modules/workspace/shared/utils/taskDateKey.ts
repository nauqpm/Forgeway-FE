import { format, isValid, parseISO } from "date-fns";

export function toTaskDateKey(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (!value.includes("T")) return value;

  const parsed = parseISO(value);
  if (!isValid(parsed)) return value.split("T")[0];

  return format(parsed, "yyyy-MM-dd");
}
