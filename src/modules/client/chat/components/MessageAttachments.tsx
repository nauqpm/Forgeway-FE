'use client';

import React from 'react';
import { Paperclip, Play, Download } from 'lucide-react';
import type { Attachment } from '../types/chat.types';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface MessageAttachmentsProps {
  attachments?: Attachment[];
  isDeleted?: boolean;
  isDownloading: string | null;
  expandedPreviews: Record<string, boolean>;
  previewUrls: Record<string, string>;
  loadingPreviews: Record<string, boolean>;
  onDownloadFile: (file: Attachment, forceDownload?: boolean) => void;
  onTogglePreview: (url: string) => void;
  onOpenLightbox: (file: { url: string; name: string; mimeType?: string }) => void;
  onImageContextMenu: (event: React.MouseEvent, file: Attachment) => void;
}

export default function MessageAttachments({
  attachments,
  isDeleted = false,
  isDownloading,
  expandedPreviews,
  previewUrls,
  loadingPreviews,
  onDownloadFile,
  onTogglePreview,
  onOpenLightbox,
  onImageContextMenu,
}: MessageAttachmentsProps) {
  if (isDeleted || !attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2 justify-start">
      {attachments.map((file, idx) => {
        const mime = file.mimeType || '';
        const filename = file.name || 'File';
        const isImg = mime.startsWith('image/');
        const isVideo = mime.startsWith('video/');
        const isPdf = mime === 'application/pdf';
        const isTxt = mime.startsWith('text/');
        const canPreview = isPdf || isTxt;
        const isExpanded = !!expandedPreviews[file.url];
        const isLoading = !!loadingPreviews[file.url];

        return (
          <div 
            key={idx} 
            className={cn(
              "border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] overflow-hidden bg-white dark:bg-[#252525] shadow-sm transition-all duration-200",
              isImg || isVideo ? "max-w-full sm:max-w-[350px]" : isExpanded ? "w-full sm:w-[480px] max-w-full" : "max-w-full sm:max-w-[350px]"
            )}
          >
            {isImg ? (
              <img 
                src={file.url} 
                alt={filename} 
                className="w-full h-auto max-h-[300px] object-contain block hover:opacity-95 transition-opacity cursor-pointer" 
                onClick={() => onOpenLightbox({ url: file.url, name: filename, mimeType: file.mimeType })}
                onContextMenu={(event) => onImageContextMenu(event, file)}
              />
            ) : isVideo ? (
              <div 
                className="relative group cursor-pointer bg-black flex items-center justify-center w-full max-h-[300px] aspect-video overflow-hidden"
                onClick={() => onOpenLightbox({ url: file.url, name: filename, mimeType: file.mimeType })}
              >
                <video 
                  src={file.url} 
                  preload="metadata"
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                    <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                <div className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F0F0EE] dark:bg-white/8 rounded flex items-center justify-center shrink-0">
                    <Paperclip className="w-5 h-5 text-[#787774]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 w-full">
                      <button 
                        onClick={() => onDownloadFile(file)}
                        disabled={isDownloading === file.url}
                        className="text-xs font-medium hover:underline text-[#2563EB] dark:text-[#3B82F6] block truncate text-left disabled:opacity-60 disabled:no-underline flex-1 cursor-pointer"
                      >
                        {isDownloading === file.url ? 'Downloading...' : filename}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadFile(file, true)}
                        disabled={isDownloading === file.url}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {canPreview && (
                        <button
                          onClick={() => onTogglePreview(file.url)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#F0F0EE] dark:hover:bg-white/10 text-[#787774] transition-colors shrink-0 cursor-pointer"
                          title={isExpanded ? "Collapse preview" : "Expand preview"}
                        >
                          {isLoading && !previewUrls[file.url] ? (
                            <span className="w-2.5 h-2.5 border border-[#787774] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="text-[9px] select-none">{isExpanded ? '▲' : '▼'}</span>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#787774] dark:text-[#9B9A97]">{Math.round(file.size / 1024)} KB</p>
                  </div>
                </div>
                
                {/* Expanded Preview Container */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-[#FAF9F6] dark:bg-[#1C1C1C]">
                    <div className="mt-3 rounded-[6px] overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06] bg-white h-[300px] flex items-center justify-center">
                      {previewUrls[file.url] ? (
                        isPdf ? (
                          <iframe 
                            src={previewUrls[file.url]} 
                            className="w-full h-full border-none" 
                            title={filename}
                          />
                        ) : (
                          <iframe 
                            src={previewUrls[file.url]} 
                            className="w-full h-full border-none bg-white p-3 font-mono text-[11px] overflow-auto" 
                            title={filename}
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#787774]">
                          <span className="w-5 h-5 border-2 border-[#787774] border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px]">Loading preview...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
