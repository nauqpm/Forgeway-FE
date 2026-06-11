// Hook managing document version history in the editor,
// providing functions to fetch saved versions, create a new version, and restore to a specific version,
// while tracking loading state and handling errors when interacting with version history API.
"use client";

import { useState, useCallback, useEffect } from "react";
import { pagesService } from "../services/pages.service";
import type { DocumentVersion } from "../types/docs.type";
import { toast } from "react-hot-toast";

interface UseVersionHistoryProps {
  pageId: string | undefined;
  enabled?: boolean;
}

export function useVersionHistory({ pageId, enabled = true }: UseVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!pageId) return;
    setIsLoading(true);
    try {
      const data = await pagesService.getVersions(pageId);
      setVersions(data);
    } catch (error) {
      console.error("Failed to fetch page versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const createVersion = useCallback(
    async (label: string) => {
      if (!pageId) return null;
      try {
        const newVer = await pagesService.createVersion(pageId, label);
        toast.success(`Version created: "${label}"`);
        setVersions((prev) => [newVer, ...prev]);
        return newVer;
      } catch (error) {
        console.error("Failed to create version:", error);
        toast.error("Failed to create new version");
        throw error;
      }
    },
    [pageId]
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      if (!pageId) return null;
      try {
        const restoredDoc = await pagesService.restoreVersion(pageId, versionId);
        toast.success("Version restored successfully! Reloading...");
        // Reload page to re-initialize editor with restored state
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
    [pageId]
  );

  useEffect(() => {
    if (enabled && pageId) {
      void fetchVersions();
    }
  }, [pageId, enabled, fetchVersions]);

  return {
    versions,
    isLoading,
    fetchVersions,
    createVersion,
    restoreVersion,
  };
}
