import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function useEntityList<T>(queryKey: unknown[], fetcher: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const { data, isLoading, error, refetch } = useQuery({ queryKey, queryFn: fetcher });

  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  return { items, setItems, isLoading, error, refetch };
}
