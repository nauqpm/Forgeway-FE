import type { GlobalSearchItem } from "../services/globalSearch.service";

const RECENT_SEARCH_ITEMS_KEY_PREFIX = "global-search-recent-items";
const MAX_RECENT_SEARCH_ITEMS = 8;

export const RECENT_SEARCH_ITEMS_CHANGED_EVENT = "global-search-recent-items-changed";

export type RecentSearchItemsChangedDetail = {
  userId: string;
  items: GlobalSearchItem[];
};

type SearchHistoryStorage = Pick<Storage, "getItem" | "setItem">;

const storageKey = (userId: string) => `${RECENT_SEARCH_ITEMS_KEY_PREFIX}:${userId}`;

const getBrowserStorage = (): SearchHistoryStorage | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const dispatchRecentSearchItemsChanged = (
  userId: string,
  items: GlobalSearchItem[],
) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<RecentSearchItemsChangedDetail>(
      RECENT_SEARCH_ITEMS_CHANGED_EVENT,
      { detail: { userId, items } },
    ),
  );
};

const isGlobalSearchItem = (value: unknown): value is GlobalSearchItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<GlobalSearchItem>;
  return Boolean(item.id && item.type && item.title && item.url);
};

export function readRecentSearchItems(
  userId?: string,
  storage: SearchHistoryStorage | null = getBrowserStorage(),
): GlobalSearchItem[] {
  if (!userId || !storage) return [];

  try {
    const parsed = JSON.parse(storage.getItem(storageKey(userId)) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter(isGlobalSearchItem).slice(0, MAX_RECENT_SEARCH_ITEMS) : [];
  } catch {
    return [];
  }
}

export function addRecentSearchItem(
  userId: string | undefined,
  item: GlobalSearchItem,
  storage: SearchHistoryStorage | null = getBrowserStorage(),
): GlobalSearchItem[] {
  if (!userId || !storage) return [];

  const nextItems = [
    item,
    ...readRecentSearchItems(userId, storage).filter(
      (recentItem) => recentItem.id !== item.id || recentItem.type !== item.type,
    ),
  ].slice(0, MAX_RECENT_SEARCH_ITEMS);

  try {
    storage.setItem(storageKey(userId), JSON.stringify(nextItems));
  } catch {
    // Keep the in-memory result available when localStorage is full or blocked.
    dispatchRecentSearchItemsChanged(userId, nextItems);
    return nextItems;
  }

  dispatchRecentSearchItemsChanged(userId, nextItems);
  return nextItems;
}

export function isRecentSearchStorageKey(key: string | null, userId?: string): boolean {
  return Boolean(userId && key === storageKey(userId));
}
