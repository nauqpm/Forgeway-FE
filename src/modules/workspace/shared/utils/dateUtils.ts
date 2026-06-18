export function normalizeDate(value?: string | null): string | undefined {
  return value ? value.split('T')[0] : undefined;
}
