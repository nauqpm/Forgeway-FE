// ──────────────────────────────────────────────────────────────
// Version-history entry — mirrors BE VersionHistoryEntryDto
// ──────────────────────────────────────────────────────────────
export interface VersionHistoryEntry {
  editedBy: string;
  editedAt: string;
  changes: string;
}

// ──────────────────────────────────────────────────────────────
// Document — maps to BE PageResponseDto
//
// BE returns `_id` as the unique identifier.  We keep `id` as an
// alias so every FE component can reference `doc.id` uniformly.
// The mapping happens inside `pages.service.ts`.
// ──────────────────────────────────────────────────────────────
export interface Document {
  id: string;               // mapped from BE `_id`
  title: string;
  content: string;           // Raw HTML from TipTap
  parentId: string | null;   // null = root page
  workspaceId: string;
  slug: string;
  authorId: string;
  lastEditedBy?: string;
  version: number;
  status: 'draft' | 'published';
  labels: string[];
  versionHistory: VersionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Raw BE response shape (before mapping)
// ──────────────────────────────────────────────────────────────
export interface PageApiResponse {
  _id: string;
  title: string;
  content: string;
  parentId?: string | null;
  workspaceId: string;
  slug: string;
  authorId: string;
  lastEditedBy?: string;
  version: number;
  status: 'draft' | 'published';
  labels: string[];
  versionHistory: VersionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Create-page payload
// ──────────────────────────────────────────────────────────────
export interface CreatePagePayload {
  title: string;
  content?: string;
  workspaceId?: string;
  parentId?: string | null;
  slug?: string;
  status?: 'draft' | 'published';
  labels?: string[];
}

// ──────────────────────────────────────────────────────────────
// Update-page payload (partial)
// ──────────────────────────────────────────────────────────────
export interface UpdatePagePayload {
  title?: string;
  content?: string;
  status?: 'draft' | 'published';
  labels?: string[];
}

// ──────────────────────────────────────────────────────────────
// Zustand store state + actions
// ──────────────────────────────────────────────────────────────
export interface DocsState {
  documents: Document[];
  selectedDocumentId: string | null;
  expandedNodes: string[];
  searchQuery: string;
  isSaving: boolean;
  isLoading: boolean;
  recentDocumentIds: string[];
  /** Track which parent IDs have had their children lazy-loaded */
  loadedChildrenOf: string[];

  // ── Sync actions (pure state) ──────────────────────────────
  setDocuments: (documents: Document[]) => void;
  selectDocument: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setIsSaving: (saving: boolean) => void;
  setIsLoading: (loading: boolean) => void;

  // ── Async actions (call API) ───────────────────────────────
  loadRootPages: (workspaceId: string) => Promise<void>;
  loadChildren: (parentId: string) => Promise<void>;
  createDocument: (workspaceId: string, parentId?: string | null) => Promise<Document | null>;
  updateDocument: (id: string, updates: Partial<Pick<Document, "title" | "content">>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  renameDocument: (id: string, newTitle: string) => Promise<void>;
}
