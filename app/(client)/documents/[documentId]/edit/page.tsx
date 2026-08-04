"use client";

import { use } from "react";
import DocumentsLibraryContent from "@/modules/docs/components/DocumentsLibraryContent";

export default function DocumentEditPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params);
  return <DocumentsLibraryContent documentId={documentId} documentMode="edit" />;
}
