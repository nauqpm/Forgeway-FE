// Store managing document state in the docs module, 
// including document list, selected document, expanded state of tree structure,
// search queries, save and loading states, 
// recent documents list, 
// and methods to interact with APIs (create, update, save, delete, rename).

import { create } from "zustand";
import { toast } from "react-hot-toast";
import { DocsState, Document } from "../types/docs.type";
import { pagesService } from "../services/pages.service";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return res?.data?.message || res?.data?.error || fallback;
  }
  return fallback;
};

const getDescendantIds = (docs: Document[], parentId: string): string[] => {
  const children = docs.filter((doc) => doc.parentId === parentId);
  let ids = children.map((child) => child.id);

  children.forEach((child) => {
    ids = [...ids, ...getDescendantIds(docs, child.id)];
  });

  return ids;
};

const isTemporaryDocument = (id: string) => id.startsWith("temp-");

export const useDocsStore = create<DocsState>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  selectedImportedDocumentId: null,
  expandedNodes: [],
  searchQuery: "",
  isSaving: false,
  isLoading: false,
  recentDocumentIds: [],
  loadedChildrenOf: [],

  setDocuments: (documents) => set({ documents }),

  selectDocument: (id) => {
    const state = get();
    if (!id) {
      set({ selectedDocumentId: null, selectedImportedDocumentId: null });
      return;
    }

    const newRecent = [id, ...state.recentDocumentIds.filter((docId) => docId !== id)].slice(0, 5);
    let currentDoc = state.documents.find((doc) => doc.id === id);
    const toExpand = [...state.expandedNodes];

    while (currentDoc?.parentId) {
      if (!toExpand.includes(currentDoc.parentId)) {
        toExpand.push(currentDoc.parentId);
      }
      currentDoc = state.documents.find((doc) => doc.id === currentDoc!.parentId);
    }

    set({
      selectedDocumentId: id,
      selectedImportedDocumentId: null,
      expandedNodes: toExpand,
      recentDocumentIds: newRecent,
    });
  },

  selectImportedDocument: (id) =>
    set({
      selectedImportedDocumentId: id,
      selectedDocumentId: null,
    }),

  toggleExpand: (id) =>
    set((state) => {
      const isExpanded = state.expandedNodes.includes(id);
      return {
        expandedNodes: isExpanded
          ? state.expandedNodes.filter((nodeId) => nodeId !== id)
          : [...state.expandedNodes, id],
      };
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsLoading: (isLoading) => set({ isLoading }),

  loadRootPages: async (workspaceId: string) => {
    set({ isLoading: true });
    try {
      const rootPages = await pagesService.getRootPages(workspaceId);
      set({ documents: rootPages, isLoading: false });
    } catch (error) {
      console.error("Failed to load root pages:", error);
      set({ isLoading: false });
    }
  },

  loadChildren: async (parentId: string) => {
    const state = get();
    if (state.loadedChildrenOf.includes(parentId)) return;

    try {
      const children = await pagesService.getChildren(parentId);
      set((current) => ({
        documents: [
          ...current.documents,
          ...children.filter((child) => !current.documents.some((doc) => doc.id === child.id)),
        ],
        loadedChildrenOf: [...current.loadedChildrenOf, parentId],
      }));
    } catch (error) {
      console.error(`Failed to load children for ${parentId}:`, error);
    }
  },

  createDocument: async (workspaceId: string, parentId: string | null = null) => {
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const tempDoc: Document = {
      id: tempId,
      title: "",
      content: "",
      parentId,
      workspaceId,
      slug: `untitled-document-${Date.now()}`,
      authorId: "",
      version: 1,
      status: "draft",
      labels: [],
      versionHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      documents: [...state.documents, tempDoc],
      expandedNodes:
        parentId && !state.expandedNodes.includes(parentId)
          ? [...state.expandedNodes, parentId]
          : state.expandedNodes,
    }));

    return tempDoc;
  },

  updateDocument: async (id, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc,
      ),
    }));
  },

  saveDocument: async (id) => {
    const doc = get().documents.find((item) => item.id === id);
    if (!doc) return null;

    set({ isSaving: true });

    try {
      const payload = {
        title: doc.title.trim() || "Untitled Document",
        content: doc.content,
      };

      const savedDoc = isTemporaryDocument(id)
        ? await pagesService.createPage({
            ...payload,
            workspaceId: doc.workspaceId,
            parentId: doc.parentId ?? undefined,
            slug: doc.slug,
            status: doc.status,
            labels: doc.labels,
          })
        : await pagesService.updatePage(id, payload);

      set((state) => ({
        documents: state.documents.map((item) => (item.id === id ? savedDoc : item)),
        selectedDocumentId: state.selectedDocumentId === id ? savedDoc.id : state.selectedDocumentId,
        recentDocumentIds: state.recentDocumentIds.map((recentId) =>
          recentId === id ? savedDoc.id : recentId,
        ),
        isSaving: false,
      }));

      toast.success("Document saved");
      return savedDoc;
    } catch (error) {
      console.error(`Failed to save document ${id}:`, error);
      toast.error(getErrorMessage(error, "Could not save page"));
      set({ isSaving: false });
      return null;
    }
  },

  deleteDocument: async (id) => {
    const state = get();
    const descendants = getDescendantIds(state.documents, id);
    const toDelete = [id, ...descendants];
    const snapshotDocs = state.documents;
    const snapshotSelected = state.selectedDocumentId;
    const snapshotRecent = state.recentDocumentIds;
    const newDocuments = state.documents.filter((doc) => !toDelete.includes(doc.id));
    const isSelectedDeleted = state.selectedDocumentId && toDelete.includes(state.selectedDocumentId);
    const newRecent = state.recentDocumentIds.filter((docId) => !toDelete.includes(docId));

    set({
      documents: newDocuments,
      selectedDocumentId: isSelectedDeleted ? null : state.selectedDocumentId,
      recentDocumentIds: newRecent,
    });

    if (isTemporaryDocument(id)) return;

    try {
      await pagesService.deletePage(id);
    } catch (error) {
      console.error(`Failed to delete document ${id}:`, error);
      toast.error(getErrorMessage(error, "Could not delete page"));
      set({
        documents: snapshotDocs,
        selectedDocumentId: snapshotSelected,
        recentDocumentIds: snapshotRecent,
      });
    }
  },

  renameDocument: async (id, newTitle) => {
    const state = get();
    const oldDoc = state.documents.find((doc) => doc.id === id);
    if (!oldDoc) return;

    set((current) => ({
      documents: current.documents.map((doc) =>
        doc.id === id ? { ...doc, title: newTitle, updatedAt: new Date().toISOString() } : doc,
      ),
    }));

    if (isTemporaryDocument(id)) return;

    try {
      await pagesService.updatePage(id, { title: newTitle });
    } catch (error) {
      console.error(`Failed to rename document ${id}:`, error);
      toast.error(getErrorMessage(error, "Could not rename page"));
      set((current) => ({
        documents: current.documents.map((doc) => (doc.id === id ? oldDoc : doc)),
      }));
    }
  },
}));
