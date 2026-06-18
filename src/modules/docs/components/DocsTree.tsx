"use client";

import { Document } from "../types/docs.type";
import DocsTreeItem from "./DocsTreeItem";

interface DocsTreeProps {
  docs: Document[];
  workspaceId: string;
  level: number;
}

export default function DocsTree({ docs, workspaceId, level }: DocsTreeProps) {
  // Sort by title alphabetically or by creation date if needed. Keep the current order or sort by title here.
  const sortedDocs = [...docs].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <ul className="space-y-0.5">
      {sortedDocs.map((doc) => (
        <DocsTreeItem key={doc.id} doc={doc} workspaceId={workspaceId} level={level} />
      ))}
    </ul>
  );
}
