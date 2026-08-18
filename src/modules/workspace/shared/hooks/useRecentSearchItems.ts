"use client";

import { useCallback, useEffect, useState } from "react";

import type { GlobalSearchItem } from "../services/globalSearch.service";
import {
  addRecentSearchItem,
  isRecentSearchStorageKey,
  readRecentSearchItems,
  RECENT_SEARCH_ITEMS_CHANGED_EVENT,
  type RecentSearchItemsChangedDetail,
} from "../utils/recentSearchItems";

export function useRecentSearchItems(userId?: string) {
  const [items, setItems] = useState<GlobalSearchItem[]>([]);

  const refresh = useCallback(() => {
    setItems(readRecentSearchItems(userId));
  }, [userId]);

  useEffect(() => {
    refresh();

    const handleStorage = (event: StorageEvent) => {
      if (isRecentSearchStorageKey(event.key, userId)) refresh();
    };

    const handleRecentItemsChanged = (event: Event) => {
      const detail = (event as CustomEvent<RecentSearchItemsChangedDetail>).detail;
      if (detail?.userId === userId) {
        setItems(detail.items);
        return;
      }

      refresh();
    };

    window.addEventListener(RECENT_SEARCH_ITEMS_CHANGED_EVENT, handleRecentItemsChanged);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(RECENT_SEARCH_ITEMS_CHANGED_EVENT, handleRecentItemsChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh, userId]);

  const addItem = useCallback(
    (item: GlobalSearchItem) => {
      addRecentSearchItem(userId, item);
    },
    [userId],
  );

  return { recentSearchItems: items, addRecentSearchItem: addItem };
}
