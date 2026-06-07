"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DocumentItem } from "../types/document.type";
import { documentService } from "../services/documentService";
import OnlineDocumentEditorModal from "./OnlineDocumentEditorModal";
import { useDocsStore } from "../store/docs.store";

type Props = {
  doc: DocumentItem;
  showBackButton?: boolean;
};

export default function ImportedDocumentViewer({ doc, showBackButton = true }: Props) {
  const { user } = useAuth();
  const { selectDocument } = useDocsStore();
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
      <div className="border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-4 py-3">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              type="button"
              onClick={() => selectDocument(null)}
              className="inline-flex items-center gap-2 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] px-3 py-2 text-xs font-semibold text-[#787774] dark:text-[#9B9A97] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}
          {isOnline && isOwner && (
          <button
            onClick={() => setOpenEditor(true)}
            className="rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
          >
            Edit
          </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-[#F9F9F8] dark:bg-[#252525] p-4 overflow-auto">
        {isImage ? (
          <img src={viewUrl} alt={currentDoc.name} className="max-w-full h-auto mx-auto rounded-[6px]" />
        ) : isPdf ? (
          <iframe src={viewUrl} className="w-full h-full min-h-[500px] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06]" />
        ) : isOfficePreview || isOnline ? (
          <iframe sandbox="allow-same-origin" src={previewUrl} className="w-full h-full min-h-[500px] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] text-[#787774] dark:text-[#9B9A97] mb-2">This format is not supported for direct preview.</p>
              <a href={downloadUrl} className="text-[13px] text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8]">Download to view</a>
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
