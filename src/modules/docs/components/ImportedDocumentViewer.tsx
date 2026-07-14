"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Download } from "lucide-react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { queryKeys } from "@/shared/constants/queryKeys";
import { DocumentItem } from "../types/document.type";
import { documentService } from "../services/documentService";
import OnlineDocumentEditorModal from "./OnlineDocumentEditorModal";
import { useDocsStore } from "../store/docs.store";

type Props = {
  doc: DocumentItem;
  showBackButton?: boolean;
  onEdit?: () => void;
};

export default function ImportedDocumentViewer({ doc, showBackButton = true, onEdit }: Props) {
  const { user } = useAuth();
  const { selectDocument } = useDocsStore();
  const [openEditor, setOpenEditor] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(doc);

  useEffect(() => {
    setCurrentDoc(doc);
  }, [doc]);
  const downloadUrl = documentService.downloadUrl(doc._id);
  const isOnline = currentDoc.documentType === "online";
  const isOwner = user?.id === currentDoc.uploadedBy;
  const isImage = currentDoc.mimeType.startsWith("image/");
  const isPdf = currentDoc.mimeType === "application/pdf";
  const isOfficePreview =
    currentDoc.extension === ".docx" || currentDoc.extension === ".xlsx" || currentDoc.extension === ".pptx";
  const canPreviewAsHtml = isOfficePreview || isOnline;
  const canPreviewAsBlob = isImage || isPdf;

  const viewBlobQuery = useQuery({
    queryKey: queryKeys.docs.viewBlob(currentDoc._id),
    queryFn: () => documentService.getViewBlob(currentDoc._id),
    enabled: canPreviewAsBlob,
  });

  const previewHtmlQuery = useQuery({
    queryKey: queryKeys.docs.previewHtml(currentDoc._id),
    queryFn: () => documentService.getPreviewHtml(currentDoc._id),
    enabled: canPreviewAsHtml,
  });

  const objectUrl = useMemo(() => {
    if (!viewBlobQuery.data) return null;
    return URL.createObjectURL(viewBlobQuery.data);
  }, [viewBlobQuery.data]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const isPreviewLoading = viewBlobQuery.isLoading || previewHtmlQuery.isLoading;
  const previewError = viewBlobQuery.isError || previewHtmlQuery.isError;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] px-4 py-2">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              type="button"
              onClick={() => selectDocument(null)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] text-[#787774] dark:text-[#9B9A97] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5"
              aria-label="Back to all documents"
              title="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">{currentDoc.name}</p>
            <span className="mt-1 inline-flex rounded-[4px] bg-[#FBF3DB] px-2 py-0.5 text-[0.625rem] font-semibold text-[#956400] dark:bg-[rgba(149,100,0,0.12)] dark:text-[#F59E0B]">
              Imported file
            </span>
          </div>
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-2 rounded-[6px] border border-[#EAEAEA] px-3 py-2 text-xs font-semibold text-[#787774] transition-colors hover:bg-[#F7F6F3] dark:border-white/[0.06] dark:text-[#9B9A97] dark:hover:bg-white/5"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          {isOnline && isOwner && (
            <button
              onClick={() => {
                if (onEdit) {
                  onEdit();
                  return;
                }
                setOpenEditor(true);
              }}
              className="rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-[#F9F9F8] dark:bg-[#252525] p-3 overflow-auto">
        {isPreviewLoading ? (
          <div className="flex min-h-full items-center justify-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            Loading preview...
          </div>
        ) : previewError ? (
          <div className="flex min-h-full items-center justify-center">
            <div className="text-center">
              <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Preview unavailable</p>
              <p className="mt-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">This file type cannot be previewed here. Download the file to open it locally.</p>
              <a href={downloadUrl} className="mt-3 inline-block text-[0.8125rem] text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8]">Download file</a>
            </div>
          </div>
        ) : isImage && objectUrl ? (
          <img src={objectUrl} alt={currentDoc.name} className="max-w-full h-auto mx-auto rounded-[6px]" />
        ) : isPdf && objectUrl ? (
          <iframe src={objectUrl} className="h-full min-h-full w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06]" />
        ) : canPreviewAsHtml && previewHtmlQuery.data ? (
          <iframe sandbox="allow-same-origin" srcDoc={previewHtmlQuery.data} className="h-full min-h-full w-full rounded-[6px] border border-[#EAEAEA] bg-white dark:border-white/[0.06]" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Preview unavailable</p>
              <p className="mt-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">This file type cannot be previewed here. Download the file to open it locally.</p>
              <a href={downloadUrl} className="mt-3 inline-block text-[0.8125rem] text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8]">Download file</a>
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
