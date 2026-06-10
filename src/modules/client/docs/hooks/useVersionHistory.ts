// Hook quản lý lịch sử phiên bản của tài liệu trong editor tài liệu,
// nó cung cấp các chức năng để lấy danh sách các phiên bản đã lưu, tạo mới phiên bản và khôi phục tài liệu về một phiên bản cụ thể,
// đồng thời theo dõi trạng thái tải và xử lý lỗi khi tương tác với API liên quan đến lịch sử phiên bản.
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
      toast.error("Không thể tải lịch sử phiên bản");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const createVersion = useCallback(
    async (label: string) => {
      if (!pageId) return null;
      try {
        const newVer = await pagesService.createVersion(pageId, label);
        toast.success(`Đã tạo phiên bản: "${label}"`);
        setVersions((prev) => [newVer, ...prev]);
        return newVer;
      } catch (error) {
        console.error("Failed to create version:", error);
        toast.error("Không thể tạo phiên bản mới");
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
        toast.success("Khôi phục phiên bản thành công! Đang tải lại...");
        // Reload page to re-initialize editor with restored state
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return restoredDoc;
      } catch (error) {
        console.error("Failed to restore version:", error);
        toast.error("Không thể khôi phục phiên bản");
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
