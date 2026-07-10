"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDocsStore } from "../store/docs.store";
import { useUploadedWorkspaceDocsQuery, useDocumentByIdQuery } from "../hooks/useWorkspaceDocs";
import TiptapEditor from "../editor/TiptapEditor";
import DocsDashboard from "./DocsDashboard";
import ImportedDocumentViewer from "./ImportedDocumentViewer";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { parsePageRouteParam } from "../utils/pageRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import type { Document } from "../types/docs.type";
import { buildWorkspacePagesHref } from "../utils/pageRoutes";

// ── URL parsing helpers ──────────────────────────────────────

/**
 * Parses the current URL pathname to extract pageId and edit mode.
 *
 * Supported patterns:
 *   /workspaces/:key/pages/:slug-:pageId
 *   /workspaces/:key/pages/:slug-:pageId/edit
 */
function parseDocsPathname(pathname: string): { pageId: string | null; isEditMode: boolean } {
  const match = pathname.match(/\/workspaces\/[^/]+\/pages\/([^/]+)(\/edit)?/);
  if (!match) return { pageId: null, isEditMode: false };
  const slugParam = match[1];
  const isEditMode = match[2] === "/edit";
  const { pageId } = parsePageRouteParam(slugParam);
  return { pageId, isEditMode };
}

function getCurrentPathname() {
  return typeof window !== "undefined" ? window.location.pathname : "";
}

// ── Component ────────────────────────────────────────────────

export default function DocsLayout({ workspaceId, workspaceKey }: { workspaceId: string; workspaceKey: string }) {
  const queryClient = useQueryClient();
  const { selectedDocumentId, selectDocument, selectedImportedDocumentId } = useDocsStore();
  const uploadedDocsQuery = useUploadedWorkspaceDocsQuery(workspaceId);
  const [mounted, setMounted] = useState(false);

  // ── Track current pathname ourselves so we react to both:
  //   1. Next.js router navigations (popstate from pushState by router)
  //   2. Our own window.history.pushState() calls from DocsDashboard / TiptapEditor
  // usePathname() does NOT update on manual pushState — we manage it ourselves.
  const [currentPathname, setCurrentPathname] = useState(getCurrentPathname);
  const previousWorkspaceIdRef = useRef(workspaceId);

  useEffect(() => {
    if (previousWorkspaceIdRef.current !== workspaceId) {
      selectDocument(null);
      syncedPageIdRef.current = null;
    }
    previousWorkspaceIdRef.current = workspaceId;
  }, [workspaceId, selectDocument]);

  useEffect(() => {
    setMounted(true);
    // Ensure initial pathname is synced after hydration
    setCurrentPathname(window.location.pathname);

    // Listen for browser back/forward (popstate) AND for the custom
    // "docs-push-state" event dispatched by our pushState wrappers.
    const handleLocationChange = () => {
      setCurrentPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    // Custom event fired by our pushState shims to allow DocsLayout to react
    window.addEventListener("docs-location-change", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("docs-location-change", handleLocationChange);
    };
  }, [workspaceId]);

  // ── Derive pageId and mode from pathname ──────────────────
  const { pageId: urlPageId, isEditMode } = parseDocsPathname(currentPathname);

  // When URL has a pageId but the store hasn't selected it yet (e.g., refresh),
  // we need to fetch the page by id and select it.
  const needsUrlFetch = !!urlPageId && selectedDocumentId !== urlPageId;

  // Build initialData from list cache for instant rendering on fresh navigations
  const listCacheData = queryClient.getQueryData<Document[]>(queryKeys.docs.list(workspaceId));
  const initialDataFromList = urlPageId
    ? listCacheData?.find((d) => d.id === urlPageId)
    : undefined;

  // Fetch page by id from API. If list cache already has it, initialData is used
  // and no spinner is shown — a background refetch still happens.
  const urlPageQuery = useDocumentByIdQuery(
    workspaceId,
    urlPageId,
    needsUrlFetch && !initialDataFromList, // skip API fetch if list cache already has it
    initialDataFromList,
  );

  // Sync URL → store:
  // Case A: list cache has the page → select immediately without any fetch
  // Case B: API fetch resolved → inject into list cache + select
  const syncedPageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!urlPageId || !needsUrlFetch) return;

    // Case A: found in list cache
    if (initialDataFromList && syncedPageIdRef.current !== urlPageId) {
      syncedPageIdRef.current = urlPageId;
      selectDocument(initialDataFromList.id, [initialDataFromList]);
      return;
    }

    // Case B: API resolved
    if (urlPageQuery.data && syncedPageIdRef.current !== urlPageId) {
      syncedPageIdRef.current = urlPageId;
      const page = urlPageQuery.data;
      // Upsert into list cache so TiptapEditor's useWorkspaceDocs can find it
      queryClient.setQueryData<Document[]>(queryKeys.docs.list(workspaceId), (current = []) => {
        const exists = current.some((d) => d.id === page.id);
        return exists ? current.map((d) => (d.id === page.id ? page : d)) : [...current, page];
      });
      selectDocument(page.id, [page]);
    }
  }, [urlPageId, needsUrlFetch, initialDataFromList, urlPageQuery.data, selectDocument, queryClient, workspaceId]);

  // Handle popstate to sync store when user presses browser back to /pages list
  useEffect(() => {
    const handlePopState = () => {
      const { pageId } = parseDocsPathname(window.location.pathname);
      if (!pageId) {
        // Navigated back to list — clear selection
        selectDocument(null);
        syncedPageIdRef.current = null;
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectDocument]);

  const uploadedDocs = uploadedDocsQuery.data ?? [];
  const selectedImportedDoc = uploadedDocs.find((doc) => doc._id === selectedImportedDocumentId) ?? null;

  // Use URL pageId as primary signal; store as secondary
  const effectiveDocumentId =
    previousWorkspaceIdRef.current !== workspaceId ? urlPageId : urlPageId ?? selectedDocumentId;

  // Show spinner only when fetching from API with no cached data
  const isUrlPageLoading = needsUrlFetch && !initialDataFromList && urlPageQuery.isLoading;
  // Page not found: fetch finished, no data, no list cache hit
  const isNotFound =
    !!urlPageId &&
    needsUrlFetch &&
    !initialDataFromList &&
    !urlPageQuery.isLoading &&
    !urlPageQuery.data;

  if (!mounted) return null;

  return (
    <div className="flex h-full min-h-0 flex-1 w-full bg-white dark:bg-[#252525] rounded-[8px] overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06]">
      <main className="flex flex-1 w-full flex-col bg-white dark:bg-[#252525] overflow-hidden relative">
        {isUrlPageLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#ABABAB] dark:text-[#6B6B6B]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[0.8125rem] font-medium">Loading document…</span>
            </div>
          </div>
        ) : isNotFound ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-[#787774] dark:text-[#9B9A97]">
              <span className="text-[0.9375rem] font-medium">Page not found</span>
              <button
                onClick={() => {
                  selectDocument(null);
                  window.history.pushState(null, "", buildWorkspacePagesHref(workspaceKey));
                  window.dispatchEvent(new Event("docs-location-change"));
                }}
                className="text-[0.8125rem] text-[#2563EB] hover:underline"
              >
                Back to All Documents
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!effectiveDocumentId && !selectedImportedDoc ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full flex flex-col"
              >
                <DocsDashboard workspaceId={workspaceId} workspaceKey={workspaceKey} />
              </motion.div>
            ) : selectedImportedDoc ? (
              <motion.div
                key="imported-viewer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full flex flex-col"
              >
                <ImportedDocumentViewer doc={selectedImportedDoc} />
              </motion.div>
            ) : (
              <motion.div
                key={`editor-${effectiveDocumentId}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full flex flex-col"
              >
                <TiptapEditor
                  workspaceId={workspaceId}
                  workspaceKey={workspaceKey}
                  documentId={effectiveDocumentId ?? undefined}
                  initialMode={isEditMode ? "edit" : "read"}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
