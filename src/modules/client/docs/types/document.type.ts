export type WorkspaceRef = {
  _id: string;
  name?: string;
  key?: string;
};

export type DocumentItem = {
  _id: string;
  name: string;
  originalName: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  extension: string;
  size: number;
  documentType?: "import" | "online";
  uploadedBy: string;
  workspaceIds: string[];
  createdAt?: string;
  updatedAt?: string;
};
