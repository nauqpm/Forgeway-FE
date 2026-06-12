import type { Issue } from "../types/issue.type";

type ArchiveListState = {
  items: Issue[];
  total: number;
  restoredId: string;
};

export const removeRestoredArchiveItem = ({
  items,
  total,
  restoredId,
}: ArchiveListState) => {
  const nextItems = items.filter((item) => item.id !== restoredId);
  const removed = nextItems.length !== items.length;

  return {
    items: nextItems,
    total: removed ? Math.max(total - 1, 0) : total,
  };
};
