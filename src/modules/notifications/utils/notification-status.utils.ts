export interface TaskStatusTransition {
  from: string;
  to: string;
}

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  testing: "Testing",
  done: "Done",
};

export function formatTaskStatus(value: string): string {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s_-]+/g, "");
  const knownLabel = STATUS_LABELS[normalized];
  if (knownLabel) return knownLabel;

  return trimmed
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getTaskStatusTransition(
  metadata?: Record<string, unknown>,
): TaskStatusTransition | undefined {
  const fromStatus = metadata?.fromStatus;
  const toStatus = metadata?.toStatus;
  if (typeof fromStatus !== "string" || typeof toStatus !== "string") {
    return undefined;
  }

  return {
    from: formatTaskStatus(fromStatus),
    to: formatTaskStatus(toStatus),
  };
}
