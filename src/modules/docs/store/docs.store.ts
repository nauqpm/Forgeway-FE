import { create } from "zustand";
import { DocsState } from "../types/docs.type";

export const useDocsStore = create<DocsState>((set, get) => ({
  selectedDocumentId: null,
  selectedImportedDocumentId: null,
  expandedNodes: [],
  searchQuery: "",
  recentDocumentIds: [],
  draftDocuments: [],

  selectDocument: (id, documents = []) => {
    const state = get();

    if (!id) {
      set({ selectedDocumentId: null, selectedImportedDocumentId: null });
      return;
    }

    const availableDocuments = documents.length > 0 ? documents : state.draftDocuments;
    const newRecent = [id, ...state.recentDocumentIds.filter((docId) => docId !== id)].slice(0, 5);
    let currentDoc = availableDocuments.find((doc) => doc.id === id);
    const toExpand = [...state.expandedNodes];

    while (currentDoc?.parentId) {
      if (!toExpand.includes(currentDoc.parentId)) {
        toExpand.push(currentDoc.parentId);
      }
      currentDoc = availableDocuments.find((doc) => doc.id === currentDoc!.parentId);
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

  ensureExpanded: (id) =>
    set((state) => ({
      expandedNodes: state.expandedNodes.includes(id)
        ? state.expandedNodes
        : [...state.expandedNodes, id],
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addDraftDocument: (document) =>
    set((state) => ({
      draftDocuments: [...state.draftDocuments.filter((doc) => doc.id !== document.id), document],
    })),

  updateDraftDocument: (id, updates) =>
    set((state) => ({
      draftDocuments: state.draftDocuments.map((doc) =>
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc,
      ),
    })),

  replaceDraftDocument: (id, document) =>
    set((state) => ({
      draftDocuments: state.draftDocuments.map((draft) => (draft.id === id ? document : draft)),
    })),

  removeDraftDocument: (id) =>
    set((state) => ({
      draftDocuments: state.draftDocuments.filter((doc) => doc.id !== id),
      selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
      recentDocumentIds: state.recentDocumentIds.filter((recentId) => recentId !== id),
    })),
}));
