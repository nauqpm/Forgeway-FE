export type Document = {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocFolder = {
  id: string;
  name: string;
  parentId: string | null;
  children: DocNode[];
};

export type DocNode = Document | DocFolder;

export type DocTreeItem = {
  id: string;
  type: 'document' | 'folder';
  name: string;
  icon?: string;
  indentation: number;
  isExpanded?: boolean;
  children?: DocTreeItem[];
};