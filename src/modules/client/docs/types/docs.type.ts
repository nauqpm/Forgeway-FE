export interface Document {
  id: string;
  title: string;
  content: string; // HTML hoặc JSON string
  parentId: string | null; // null nếu là root
  spaceId: string;
  createdAt: string;
  updatedAt: string;
  category?: string; // Nhóm tài liệu (Frontend, Backend, etc.)
}

export interface DocsState {
  documents: Document[];
  selectedDocumentId: string | null;
  expandedNodes: string[];
  searchQuery: string;
  isSaving: boolean;
  recentDocumentIds: string[];
  
  // Actions
  setDocuments: (documents: Document[]) => void;
  selectDocument: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  createDocument: (spaceId: string, parentId?: string | null) => Document;
  updateDocument: (id: string, updates: Partial<Pick<Document, "title" | "content" | "parentId">>) => void;
  deleteDocument: (id: string) => void;
  renameDocument: (id: string, newTitle: string) => void;
  setSearchQuery: (query: string) => void;
  setIsSaving: (saving: boolean) => void;
  duplicateDocument: (id: string) => Document | null;
}
