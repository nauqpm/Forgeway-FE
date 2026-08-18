import type { GlobalSearchType } from "../services/globalSearch.service";

export const ALL_GLOBAL_SEARCH_TYPES: GlobalSearchType[] = [
  "task",
  "page",
  "document",
  "comment",
  "workspace",
  "board",
  "sprint",
  "user",
];

export const DEFAULT_DOCUMENT_SEARCH_TYPES: GlobalSearchType[] = [
  "page",
  "document",
];
