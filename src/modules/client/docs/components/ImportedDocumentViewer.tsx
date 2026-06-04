"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DocumentItem } from "../types/document.type";
import { documentService } from "../services/documentService";
import OnlineDocumentEditorModal from "./OnlineDocumentEditorModal";

type Props = {
  doc: DocumentItem;
};

export default function ImportedDocumentViewer({ doc }: Props) {
  const { user } = useAuth();
  const [openEditor, setOpenEditor] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(doc);

  useEffect(() => {
    setCurrentDoc(doc);
  }, [doc]);
  const viewUrl = documentService.viewUrl(doc._id);
  const previewUrl = documentService.previewUrl(doc._id);
  const downloadUrl = documentService.downloadUrl(doc._id);
  const isOnline = currentDoc.documentType === "online";
  const isOwner = user?.id === currentDoc.uploadedBy;
  const isImage = currentDoc.mimeType.startsWith("image/");
  const isPdf = currentDoc.mimeType === "application/pdf";
  const isOfficePreview =
    currentDoc.extension === ".docx" || currentDoc.extension === ".xlsx" || currentDoc.extension === ".pptx";

  return (
    <div className="h-full flex flex-col">
      {isOnline && isOwner && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
          <button
            onClick={() => setOpenEditor(true)}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Edit Document
          </button>
        </div>
      )}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 overflow-auto">
        {isImage ? (
          <img src={viewUrl} alt={currentDoc.name} className="max-w-full h-auto mx-auto rounded shadow" />
        ) : isPdf ? (
          <iframe src={viewUrl} className="w-full h-full min-h-[500px] rounded border border-gray-200 dark:border-gray-700" />
        ) : isOfficePreview || isOnline ? (
          <iframe sandbox="allow-same-origin" src={previewUrl} className="w-full h-full min-h-[500px] rounded border border-gray-200 dark:border-gray-700 bg-white" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">This format is not supported for direct preview.</p>
              <a href={downloadUrl} className="text-sm text-indigo-600 hover:text-indigo-800">Download to view</a>
            </div>
          </div>
        )}
      </div>
      {isOnline && (
        <OnlineDocumentEditorModal
          doc={currentDoc}
          open={openEditor}
          onClose={() => setOpenEditor(false)}
          onSaved={(updated) => setCurrentDoc(updated)}
        />
      )}
    </div>
  );
}
