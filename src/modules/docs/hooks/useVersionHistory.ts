"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { queryKeys } from "@/shared/constants/queryKeys";
import { pagesService } from "../services/pages.service";
import type { DocumentVersion } from "../types/docs.type";

interface UseVersionHistoryProps {
  pageId: string | undefined;
  enabled?: boolean;
}

export function useVersionHistory({ pageId, enabled = true }: UseVersionHistoryProps) {
  const queryClient = useQueryClient();

  const versionsQuery = useQuery<DocumentVersion[]>({
    queryKey: queryKeys.docs.versions(pageId ?? ""),
    queryFn: () => pagesService.getVersions(pageId!),
    enabled: enabled && !!pageId,
  });

  const createVersionMutation = useMutation({
    mutationFn: (label: string) => pagesService.createVersion(pageId!, label),
    onSuccess: (newVersion) => {
      queryClient.setQueryData<DocumentVersion[]>(queryKeys.docs.versions(pageId ?? ""), (current = []) => [
        newVersion,
        ...current,
      ]);
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: (versionId: string) => pagesService.restoreVersion(pageId!, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.docs.versions(pageId ?? "") });
    },
  });

  const createVersion = useCallback(
    async (label: string) => {
      if (!pageId) return null;
      try {
        const newVersion = await createVersionMutation.mutateAsync(label);
        toast.success(`Version created: "${label}"`);
        return newVersion;
      } catch (error) {
        console.error("Failed to create version:", error);
        toast.error("Failed to create new version");
        throw error;
      }
    },
    [createVersionMutation, pageId],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      if (!pageId) return null;
      try {
        const restoredDoc = await restoreVersionMutation.mutateAsync(versionId);
        toast.success("Version restored successfully! Reloading...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return restoredDoc;
      } catch (error) {
        console.error("Failed to restore version:", error);
        toast.error("Failed to restore version");
        throw error;
      }
    },
    [pageId, restoreVersionMutation],
  );

  return {
    versions: versionsQuery.data ?? [],
    isLoading: versionsQuery.isLoading,
    fetchVersions: versionsQuery.refetch,
    createVersion,
    restoreVersion,
  };
}
