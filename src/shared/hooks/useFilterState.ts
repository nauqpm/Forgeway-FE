import { useState, Dispatch, SetStateAction } from "react";

export function useFilterState<F extends Record<string, unknown>>(
  initial: F,
): { filters: F; setFilters: Dispatch<SetStateAction<F>> } {
  const [filters, setFilters] = useState<F>(initial);
  return { filters, setFilters };
}
