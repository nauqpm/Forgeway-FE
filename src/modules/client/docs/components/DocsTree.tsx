"use client";

import { Document } from "../types/docs.type";
import DocsTreeItem from "./DocsTreeItem";

interface DocsTreeProps {
  docs: Document[];
  spaceId: string;
  level: number;
}

export default function DocsTree({ docs, spaceId, level }: DocsTreeProps) {
  // Sắp xếp theo title alphabet hoặc theo ngày tạo (tuỳ chỉnh). Ở đây giữ nguyên thứ tự hoặc sort theo title.
  const sortedDocs = [...docs].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <ul className="space-y-0.5">
      {sortedDocs.map((doc) => (
        <DocsTreeItem key={doc.id} doc={doc} spaceId={spaceId} level={level} />
      ))}
    </ul>
  );
}
