import React, { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface ImageUploadProps {
  multiple?: boolean;
  maxCount?: number;
  imageUrl?: string | string[];
  aspectRatio?: number;
  onImageSelected?: (file: File | null) => void;
  onImagesSelected?: (files: (File | string)[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  multiple = false,
  maxCount = 1,
  imageUrl,
  aspectRatio,
  onImageSelected,
  onImagesSelected,
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>(() => {
    if (!imageUrl) return [];
    return Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!validateFiles(files)) return;

    handleFiles(files);
  };

  const validateFiles = (files: File[]) => {
    if (multiple && files.length + previewUrls.length > maxCount) {
      toast.error(`Chỉ được phép tải lên tối đa ${maxCount} hình ảnh`);
      return false;
    }

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      toast.error("Chỉ chấp nhận file hình ảnh");
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFile = files.find((file) => file.size > maxSize);
    if (oversizedFile) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return false;
    }

    return true;
  };

  const handleFiles = (files: File[]) => {
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));

    if (multiple) {
      // Keep existing URLs and add new files
      const existingUrls = previewUrls.filter(url => !url.startsWith('blob:'));
      setPreviewUrls((prev) => [...existingUrls, ...newPreviewUrls]);
      
      // Combine existing URLs with new files
      const existingFiles = previewUrls
        .filter(url => !url.startsWith('blob:'))
        .map(url => url);
      onImagesSelected?.([...existingFiles, ...files]);
    } else {
      // For single file upload, revoke old preview URL if exists
      if (previewUrls.length > 0) {
        URL.revokeObjectURL(previewUrls[0]);
      }
      setPreviewUrls([newPreviewUrls[0]]);
      onImageSelected?.(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (!validateFiles(files)) return;

    handleFiles(files);
  };

  const removeImage = (index: number) => {
    const urlToRemove = previewUrls[index];
    
    // Revoke object URL if it's a blob
    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
    }

    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    
    if (multiple) {
      // Keep existing URLs that weren't removed
      const remainingUrls = previewUrls
        .filter((_, i) => i !== index)
        .filter(url => !url.startsWith('blob:'));
      onImagesSelected?.(remainingUrls);
    } else {
      onImageSelected?.(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-500"
          }
        `}
      >
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Tải lên hình ảnh
            </span>{" "}
            hoặc kéo thả vào đây
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
        </div>
      </div>

      {/* Preview Area */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative group">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={url}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
