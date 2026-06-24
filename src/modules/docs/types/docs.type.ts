export interface VersionHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  workspaceId: string;
  slug: string;
  authorId: string;
  lastEditedBy?: { _id: string; fullName: string } | null;
  version: number;
  labels: string[];
  versionHistory: VersionHistoryEntry[];
  source?: "docs" | "import";
  createdAt: string;
  updatedAt: string;
}

export interface PageApiResponse {
  _id: string;
  title: string;
  content: string;
  parentId?: string | null;
  workspaceId: string;
  slug: string;
  authorId: string;
  lastEditedBy?: { _id: string; fullName?: string; username?: string } | null;
  version: number;
  labels: string[];
  versionHistory: VersionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePagePayload {
  title: string;
  content?: string;
  workspaceId?: string;
  parentId?: string | null;
  slug?: string;
  labels?: string[];
}

export interface UpdatePagePayload {
  title?: string;
  content?: string;
  labels?: string[];
}

export interface DocsState {
  selectedDocumentId: string | null;
  selectedImportedDocumentId: string | null;
  expandedNodes: string[];
  searchQuery: string;
  recentDocumentIds: string[];
  draftDocuments: Document[];

  selectDocument: (id: string | null, documents?: Document[]) => void;
  selectImportedDocument: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  ensureExpanded: (id: string) => void;
  setSearchQuery: (query: string) => void;
  addDraftDocument: (document: Document) => void;
  updateDraftDocument: (
    id: string,
    updates: Partial<Pick<Document, "title" | "content" | "slug" | "parentId">>,
  ) => void;
  replaceDraftDocument: (id: string, document: Document) => void;
  removeDraftDocument: (id: string) => void;
}

export interface DocumentVersion {
  id: string;
  pageId: string;
  yjsState?: number[];
  contentJson?: string;
  htmlSnapshot: string;
  label: string;
  version: number;
  createdBy: { _id: string; fullName: string };
  createdAt: string;
}
