"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { queryKeys } from "@/shared/constants/queryKeys";
import { pagesService } from "../services/pages.service";
import { documentService } from "../services/documentService";
import { useDocsStore } from "../store/docs.store";
import type { DocumentItem } from "../types/document.type";
import type { CreatePagePayload, Document, UpdatePagePayload } from "../types/docs.type";

const isTemporaryDocument = (id: string) => id.startsWith("temp-");

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return res?.data?.message || res?.data?.error || fallback;
  }
  return fallback;
};

const mergeDocuments = (serverDocuments: Document[], draftDocuments: Document[]) => {
  const byId = new Map<string, Document>();

  for (const document of serverDocuments) {
    byId.set(document.id, document);
  }

  for (const document of draftDocuments) {
    byId.set(document.id, document);
  }

  return Array.from(byId.values());
};

const getDescendantIds = (documents: Document[], parentId: string): string[] => {
  const children = documents.filter((doc) => doc.parentId === parentId);
  let ids = children.map((child) => child.id);

  children.forEach((child) => {
    ids = [...ids, ...getDescendantIds(documents, child.id)];
  });

  return ids;
};

const replaceDocument = (documents: Document[], nextDocument: Document) =>
  documents.map((document) => (document.id === nextDocument.id ? nextDocument : document));

const removeDocuments = (documents: Document[], ids: string[]) =>
  documents.filter((document) => !ids.includes(document.id));

export function useWorkspaceDocsQuery(workspaceId: string, enabled = true) {
  return useQuery<Document[]>({
    queryKey: queryKeys.docs.list(workspaceId),
    queryFn: () => pagesService.getWorkspacePages(workspaceId),
    enabled: enabled && !!workspaceId,
  });
}

export function useUploadedWorkspaceDocsQuery(workspaceId: string, enabled = true) {
  return useQuery<DocumentItem[]>({
    queryKey: queryKeys.docs.uploadedByWorkspace(workspaceId),
    queryFn: () => documentService.getByWorkspace(workspaceId),
    enabled: enabled && !!workspaceId,
  });
}

export function useDocumentBySlugQuery(workspaceKey: string, slug: string, enabled = true) {
  return useQuery<Document>({
    queryKey: queryKeys.docs.bySlug(workspaceKey, slug),
    queryFn: () => pagesService.getPageBySlug(slug),
    enabled: enabled && !!slug,
  });
}

export function useWorkspaceDocs(workspaceId: string) {
  const queryClient = useQueryClient();
  const docsQuery = useWorkspaceDocsQuery(workspaceId, !!workspaceId);

  const draftDocuments = useDocsStore((state) => state.draftDocuments);
  const addDraftDocument = useDocsStore((state) => state.addDraftDocument);
  const updateDraftDocument = useDocsStore((state) => state.updateDraftDocument);
  const removeDraftDocument = useDocsStore((state) => state.removeDraftDocument);
  const selectedDocumentId = useDocsStore((state) => state.selectedDocumentId);
  const selectDocument = useDocsStore((state) => state.selectDocument);
  const ensureExpanded = useDocsStore((state) => state.ensureExpanded);

  const documents = useMemo(
    () => mergeDocuments(docsQuery.data ?? [], draftDocuments.filter((doc) => doc.workspaceId === workspaceId)),
    [docsQuery.data, draftDocuments, workspaceId],
  );

  const upsertServerDocument = useCallback(
    (nextDocument: Document) => {
      queryClient.setQueryData<Document[]>(queryKeys.docs.list(workspaceId), (current = []) => {
        const exists = current.some((document) => document.id === nextDocument.id);
        return exists ? replaceDocument(current, nextDocument) : [...current, nextDocument];
      });
      queryClient.setQueryData(queryKeys.docs.byId(workspaceId, nextDocument.id), nextDocument);
      queryClient.setQueryData(queryKeys.docs.bySlug(workspaceId, nextDocument.slug), nextDocument);
    },
    [queryClient, workspaceId],
  );

  const createPageMutation = useMutation({
    mutationFn: (payload: CreatePagePayload) => pagesService.createPage(payload),
    onSuccess: (createdDocument) => {
      upsertServerDocument(createdDocument);
    },
  });

  const savePageMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePagePayload }) =>
      pagesService.updatePage(id, payload),
    onSuccess: (savedDocument) => {
      upsertServerDocument(savedDocument);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => pagesService.deletePage(id),
  });

  const renamePageMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => pagesService.updatePage(id, { title }),
    onSuccess: (savedDocument) => {
      upsertServerDocument(savedDocument);
    },
  });

  const createDocument = useCallback(
    async (parentId: string | null = null) => {
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      const tempDocument: Document = {
        id: tempId,
        title: "Untitled Document",
        content: "",
        parentId,
        workspaceId,
        slug: `untitled-document-${Date.now()}`,
        authorId: "",
        lastEditedBy: null,
        version: 1,
        labels: [],
        versionHistory: [],
        source: "docs",
        createdAt: now,
        updatedAt: now,
      };

      addDraftDocument(tempDocument);
      if (parentId) {
        ensureExpanded(parentId);
      }
      return tempDocument;
    },
    [addDraftDocument, ensureExpanded, workspaceId],
  );

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Pick<Document, "title" | "content" | "slug" | "parentId">>) => {
      if (isTemporaryDocument(id)) {
        updateDraftDocument(id, updates);
        return;
      }

      const currentDocument = documents.find((document) => document.id === id);
      if (!currentDocument) return;

      upsertServerDocument({
        ...currentDocument,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    },
    [documents, updateDraftDocument, upsertServerDocument],
  );

  const saveDocument = useCallback(
    async (id: string) => {
      const document = documents.find((item) => item.id === id);
      if (!document) return null;

      try {
        if (isTemporaryDocument(id)) {
          const savedDocument = await createPageMutation.mutateAsync({
            title: document.title.trim() || "Untitled Document",
            content: document.content,
            workspaceId: document.workspaceId,
            parentId: document.parentId ?? undefined,
            slug: document.slug,
            labels: document.labels,
          });

          removeDraftDocument(id);
          if (selectedDocumentId === id) {
            selectDocument(savedDocument.id, [...documents.filter((item) => item.id !== id), savedDocument]);
          }
          toast.success("Document saved");
          return savedDocument;
        }

        const savedDocument = await savePageMutation.mutateAsync({
          id,
          payload: {
            title: document.title.trim() || "Untitled Document",
            content: document.content,
          },
        });

        toast.success("Document saved");
        return savedDocument;
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not save page"));
        return null;
      }
    },
    [createPageMutation, documents, removeDraftDocument, savePageMutation, selectDocument, selectedDocumentId],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const descendants = getDescendantIds(documents, id);
      const toDelete = [id, ...descendants];

      if (isTemporaryDocument(id)) {
        toDelete.forEach(removeDraftDocument);
        return;
      }

      const previousDocuments = docsQuery.data ?? [];
      queryClient.setQueryData<Document[]>(
        queryKeys.docs.list(workspaceId),
        removeDocuments(previousDocuments, toDelete),
      );
      if (selectedDocumentId && toDelete.includes(selectedDocumentId)) {
        selectDocument(null);
      }

      try {
        await deletePageMutation.mutateAsync(id);
      } catch (error) {
        queryClient.setQueryData(queryKeys.docs.list(workspaceId), previousDocuments);
        toast.error(getErrorMessage(error, "Could not delete page"));
      }
    },
    [deletePageMutation, docsQuery.data, documents, queryClient, removeDraftDocument, selectDocument, selectedDocumentId, workspaceId],
  );

  const renameDocument = useCallback(
    async (id: string, newTitle: string) => {
      const trimmedTitle = newTitle.trim();
      if (!trimmedTitle) return;

      if (isTemporaryDocument(id)) {
        updateDraftDocument(id, { title: trimmedTitle });
        return;
      }

      const currentDocument = documents.find((document) => document.id === id);
      if (!currentDocument) return;

      const optimisticDocument = {
        ...currentDocument,
        title: trimmedTitle,
        updatedAt: new Date().toISOString(),
      };

      upsertServerDocument(optimisticDocument);

      try {
        await renamePageMutation.mutateAsync({ id, title: trimmedTitle });
      } catch (error) {
        upsertServerDocument(currentDocument);
        toast.error(getErrorMessage(error, "Could not rename page"));
      }
    },
    [documents, renamePageMutation, updateDraftDocument, upsertServerDocument],
  );

  return {
    documents,
    isLoading: docsQuery.isLoading,
    isFetching: docsQuery.isFetching,
    refetch: docsQuery.refetch,
    createDocument,
    updateDocument,
    saveDocument,
    deleteDocument,
    renameDocument,
  };
}
