import { create } from "zustand";
import { DocsState, Document } from "../types/docs.type";
import { v4 as uuidv4 } from "uuid";

// Lấy tất cả id của các document con đệ quy để xóa
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

  setDocuments: (documents) => set({ documents }),
  
  selectDocument: (id) => {
    // Nếu chọn một file, ta mở parent nodes để đảm bảo file hiển thị
    const state = get();
    if (!id) {
      set({ selectedDocumentId: null });
      return;
    }
    
    let currentDoc = state.documents.find(d => d.id === id);
    let toExpand = [...state.expandedNodes];
    
    while (currentDoc?.parentId) {
      if (!toExpand.includes(currentDoc.parentId)) {
        toExpand.push(currentDoc.parentId);
      }
      currentDoc = state.documents.find(d => d.id === currentDoc!.parentId);
    }
    
    set({ selectedDocumentId: id, expandedNodes: toExpand });
  },

  toggleExpand: (id) => set((state) => {
    const isExpanded = state.expandedNodes.includes(id);
    return {
      expandedNodes: isExpanded 
        ? state.expandedNodes.filter(nodeId => nodeId !== id)
        : [...state.expandedNodes, id]
    };
  }),

  createDocument: (spaceId, parentId = null) => {
    const newDoc: Document = {
      id: uuidv4(),
      title: "Untitled Document",
      content: "<h1>Untitled Document</h1><p>Start typing...</p>",
      parentId,
      spaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      // Nếu có parent, tự động expand parent
      let newExpanded = state.expandedNodes;
      if (parentId && !newExpanded.includes(parentId)) {
        newExpanded = [...newExpanded, parentId];
      }
      
      return {
        documents: [...state.documents, newDoc],
        expandedNodes: newExpanded,
      };
    });

    return newDoc;
  },

  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map(doc => 
      doc.id === id 
        ? { ...doc, ...updates, updatedAt: new Date().toISOString() } 
        : doc
    )
  })),

  deleteDocument: (id) => set((state) => {
    const descendants = getDescendantIds(state.documents, id);
    const toDelete = [id, ...descendants];
    
    const newDocuments = state.documents.filter(d => !toDelete.includes(d.id));
    const isSelectedDeleted = state.selectedDocumentId && toDelete.includes(state.selectedDocumentId);
    
    return {
      documents: newDocuments,
      selectedDocumentId: isSelectedDeleted ? null : state.selectedDocumentId
    };
  }),

  renameDocument: (id, newTitle) => set((state) => ({
    documents: state.documents.map(doc => 
      doc.id === id ? { ...doc, title: newTitle, updatedAt: new Date().toISOString() } : doc
    )
  })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setIsSaving: (isSaving) => set({ isSaving }),
}));
