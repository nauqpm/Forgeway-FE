import { Document } from "../types/docs.type";
import { v4 as uuidv4 } from "uuid";

const now = new Date().toISOString();

export const MOCK_DOCS: Document[] = [
  {
    id: "doc-1",
    title: "Getting Started",
    content: "<h1>Getting Started</h1><p>Welcome to your new workspace. Here you can write documentation.</p>",
    parentId: null,
    workspaceId: "Workspace-1",
    createdAt: now,
    updatedAt: now,
    category: "Frontend"
  },
  {
    id: "doc-2",
    title: "Installation",
    content: "<h2>Installation Guide</h2><p>Run <code>npm install</code> to get started.</p>",
    parentId: "doc-1",
    workspaceId: "Workspace-1",
    createdAt: now,
    updatedAt: now,
    category: "Frontend"
  },
  {
    id: "doc-3",
    title: "Authentication",
    content: "<h2>Authentication</h2><p>Learn how to authenticate your API requests.</p>",
    parentId: "doc-1",
    workspaceId: "Workspace-1",
    createdAt: now,
    updatedAt: now,
    category: "Backend"
  },
  {
    id: "doc-4",
    title: "API Reference",
    content: "<h1>API Reference</h1><p>List of all available endpoints.</p>",
    parentId: null,
    workspaceId: "Workspace-1",
    createdAt: now,
    updatedAt: now,
    category: "Backend"
  },
  {
    id: "doc-5",
    title: "Endpoints",
    content: "<h2>Endpoints</h2><p>GET /api/v1/users</p>",
    parentId: "doc-4",
    workspaceId: "Workspace-1",
    createdAt: now,
    updatedAt: now,
    category: "Backend"
  },
  {
    id: "doc-6",
    title: "Design System",
    content: "<h1>Design System</h1><p>Our UI components and styles.</p>",
    parentId: null,
    workspaceId: "Workspace-1",
    createdAt: now,
    updatedAt: now,
    category: "Frontend"
  }
];
