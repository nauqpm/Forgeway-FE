"use client";

import { DocumentItem } from "../types/document.type";
import { documentService } from "../services/documentService";

type Props = {
  doc: DocumentItem;
};

export default function ImportedDocumentViewer({ doc }: Props) {
  const viewUrl = documentService.viewUrl(doc._id);
  const previewUrl = documentService.previewUrl(doc._id);
  const downloadUrl = documentService.downloadUrl(doc._id);
  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";
  const isOfficePreview =
    doc.extension === ".docx" || doc.extension === ".xlsx" || doc.extension === ".pptx";

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 overflow-auto">
        {isImage ? (
          <img src={viewUrl} alt={doc.name} className="max-w-full h-auto mx-auto rounded shadow" />
        ) : isPdf ? (
          <iframe src={viewUrl} className="w-full h-full min-h-[500px] rounded border border-gray-200 dark:border-gray-700" />
        ) : isOfficePreview ? (
          <iframe src={previewUrl} className="w-full h-full min-h-[500px] rounded border border-gray-200 dark:border-gray-700 bg-white" />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Định dạng này chưa hỗ trợ preview trực tiếp.</p>
              <a href={downloadUrl} className="text-sm text-indigo-600 hover:text-indigo-800">Tải xuống để xem</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
