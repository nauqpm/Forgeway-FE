import { Dispatch, SetStateAction } from "react";
import { QueryClient } from "@tanstack/react-query";

export function useOptimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  setItems: Dispatch<SetStateAction<T[]>>,
) {
  return {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<T[]>(queryKey);
      return { snapshot };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { snapshot?: T[] } | undefined) => {
      if (ctx?.snapshot) setItems(ctx.snapshot);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  };
}
