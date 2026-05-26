import { create } from "zustand";
import { DocsState, Document } from "../types/docs.type";
import { pagesService } from "../services/pages.service";

// ──────────────────────────────────────────────────────────────
// Helper: collect all descendant IDs (for optimistic delete)
// ──────────────────────────────────────────────────────────────
const getDescendantIds = (docs: Document[], parentId: string): string[] => {
  const children = docs.filter(d => d.parentId === parentId);
  let ids = children.map(c => c.id);
  children.forEach(c => {
    ids = [...ids, ...getDescendantIds(docs, c.id)];
  });
  return ids;
};

export const useDocsStore = create<DocsState>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  expandedNodes: [],
  searchQuery: "",
  isSaving: false,
  isLoading: false,
  recentDocumentIds: [],
  loadedChildrenOf: [],

  // ── Pure state setters ─────────────────────────────────────
  setDocuments: (documents) => set({ documents }),

  selectDocument: (id) => {
    const state = get();
    if (!id) {
      set({ selectedDocumentId: null });
      return;
    }

    // Update recent documents
    const newRecent = [id, ...state.recentDocumentIds.filter(docId => docId !== id)].slice(0, 5);

    // Auto-expand parent chain
    let currentDoc = state.documents.find(d => d.id === id);
    let toExpand = [...state.expandedNodes];

    while (currentDoc?.parentId) {
      if (!toExpand.includes(currentDoc.parentId)) {
        toExpand.push(currentDoc.parentId);
      }
      currentDoc = state.documents.find(d => d.id === currentDoc!.parentId);
    }

    set({
      selectedDocumentId: id,
      expandedNodes: toExpand,
      recentDocumentIds: newRecent
    });
  },

  toggleExpand: (id) => set((state) => {
    const isExpanded = state.expandedNodes.includes(id);
    return {
      expandedNodes: isExpanded
        ? state.expandedNodes.filter(nodeId => nodeId !== id)
        : [...state.expandedNodes, id]
    };
  }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // ── Async: Load root pages from API ────────────────────────
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

  // ── Async: Lazy-load children of a node ────────────────────
  loadChildren: async (parentId: string) => {
    const state = get();
    // Skip if already loaded
    if (state.loadedChildrenOf.includes(parentId)) return;

    try {
      const children = await pagesService.getChildren(parentId);
      set((s) => ({
        documents: [
          ...s.documents,
          // Avoid duplicates (in case of race conditions)
          ...children.filter(c => !s.documents.some(d => d.id === c.id)),
        ],
        loadedChildrenOf: [...s.loadedChildrenOf, parentId],
      }));
    } catch (error) {
      console.error(`Failed to load children for ${parentId}:`, error);
    }
  },

  // ── Async: Create document (optimistic) ────────────────────
  createDocument: async (workspaceId: string, parentId: string | null = null) => {
    // Optimistic: add a temporary document
    const tempId = `temp-${Date.now()}`;
    const tempDoc: Document = {
      id: tempId,
      title: "Untitled Document",
      content: "<h1>Untitled Document</h1><p>Start typing...</p>",
      parentId,
      workspaceId: workspaceId,
      slug: "",
      authorId: "",
      version: 1,
      status: "draft",
      labels: [],
      versionHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      let newExpanded = state.expandedNodes;
      if (parentId && !newExpanded.includes(parentId)) {
        newExpanded = [...newExpanded, parentId];
      }
      return {
        documents: [...state.documents, tempDoc],
        expandedNodes: newExpanded,
      };
    });

    try {
      const realDoc = await pagesService.createPage({
        title: tempDoc.title,
        content: tempDoc.content,
        workspaceId: workspaceId,
        parentId: parentId ?? undefined,
      });

      // Replace temp doc with real doc from API
      set((state) => ({
        documents: state.documents.map(d => d.id === tempId ? realDoc : d),
        // If the temp doc was selected, update selection to real ID
        selectedDocumentId: state.selectedDocumentId === tempId ? realDoc.id : state.selectedDocumentId,
        recentDocumentIds: state.recentDocumentIds.map(rid => rid === tempId ? realDoc.id : rid),
      }));

      return realDoc;
    } catch (error) {
      console.error("Failed to create document:", error);
      // Rollback: remove the temp document
      set((state) => ({
        documents: state.documents.filter(d => d.id !== tempId),
        selectedDocumentId: state.selectedDocumentId === tempId ? null : state.selectedDocumentId,
      }));
      return null;
    }
  },

  // ── Async: Update document (content/title save) ────────────
  updateDocument: async (id, updates) => {
    const state = get();
    const oldDoc = state.documents.find(d => d.id === id);
    if (!oldDoc) return;

    // Optimistic update
    set((s) => ({
      documents: s.documents.map(doc =>
        doc.id === id
          ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
          : doc
      )
    }));

    try {
      await pagesService.updatePage(id, updates);
    } catch (error) {
      console.error(`Failed to update document ${id}:`, error);
      // Rollback
      set((s) => ({
        documents: s.documents.map(doc =>
          doc.id === id ? oldDoc : doc
        )
      }));
    }
  },

  // ── Async: Delete document (optimistic) ────────────────────
  deleteDocument: async (id) => {
    const state = get();
    const descendants = getDescendantIds(state.documents, id);
    const toDelete = [id, ...descendants];

    // Snapshot for rollback
    const snapshotDocs = state.documents;
    const snapshotSelected = state.selectedDocumentId;
    const snapshotRecent = state.recentDocumentIds;

    const newDocuments = state.documents.filter(d => !toDelete.includes(d.id));
    const isSelectedDeleted = state.selectedDocumentId && toDelete.includes(state.selectedDocumentId);
    const newRecent = state.recentDocumentIds.filter(docId => !toDelete.includes(docId));

    // Optimistic remove
    set({
      documents: newDocuments,
      selectedDocumentId: isSelectedDeleted ? null : state.selectedDocumentId,
      recentDocumentIds: newRecent,
    });

    try {
      await pagesService.deletePage(id);
    } catch (error) {
      console.error(`Failed to delete document ${id}:`, error);
      // Rollback
      set({
        documents: snapshotDocs,
        selectedDocumentId: snapshotSelected,
        recentDocumentIds: snapshotRecent,
      });
    }
  },

  // ── Async: Rename document (optimistic) ────────────────────
  renameDocument: async (id, newTitle) => {
    const state = get();
    const oldDoc = state.documents.find(d => d.id === id);
    if (!oldDoc) return;

    // Optimistic
    set((s) => ({
      documents: s.documents.map(doc =>
        doc.id === id ? { ...doc, title: newTitle, updatedAt: new Date().toISOString() } : doc
      )
    }));

    try {
      await pagesService.updatePage(id, { title: newTitle });
    } catch (error) {
      console.error(`Failed to rename document ${id}:`, error);
      // Rollback
      set((s) => ({
        documents: s.documents.map(doc =>
          doc.id === id ? oldDoc : doc
        )
      }));
    }
  },
}));
