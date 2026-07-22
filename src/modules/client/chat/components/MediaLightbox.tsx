'use client';

import React from 'react';
import { Download, X } from 'lucide-react';

export interface LightboxFile {
  url: string;
  name: string;
  mimeType?: string;
}

interface MediaLightboxProps {
  file: LightboxFile | null;
  isDownloading?: boolean;
  onDownload: (file: LightboxFile) => void;
  onClose: () => void;
}

export default function MediaLightbox({
  file,
  isDownloading = false,
  onDownload,
  onClose,
}: MediaLightboxProps) {
  if (!file) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center cursor-zoom-out select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div 
        className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-6 text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-medium truncate max-w-[70%]">
          {file.name}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDownload(file)}
            disabled={isDownloading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {file.mimeType?.toLowerCase().startsWith('video/') ? (
        <video
          src={file.url}
          controls
          preload="metadata"
          className="max-w-[90vw] max-h-[85vh] rounded-md shadow-2xl mt-10 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={file.url}
          alt="Preview"
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl select-none mt-10"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
