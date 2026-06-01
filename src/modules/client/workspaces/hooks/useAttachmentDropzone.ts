import { ClipboardEvent, DragEvent, useCallback, useRef, useState } from "react";

interface UseAttachmentDropzoneOptions {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

const filesFromList = (files?: FileList | null) =>
  files ? Array.from(files).filter((file) => file.size > 0) : [];

export const useAttachmentDropzone = ({
  disabled = false,
  onFiles,
}: UseAttachmentDropzoneOptions) => {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragDepthRef = useRef(0);

  const submitFiles = useCallback(
    (files: File[]) => {
      if (disabled || files.length === 0) return;
      onFiles(files);
    },
    [disabled, onFiles],
  );

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled) return;
      const hasFiles = Array.from(event.dataTransfer.types).includes("Files");
      if (!hasFiles) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingFiles(true);
    },
    [disabled],
  );

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled) return;
      if (!Array.from(event.dataTransfer.types).includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [disabled],
  );

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (disabled) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingFiles(false);
    }
  }, [disabled]);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFiles(false);
      submitFiles(filesFromList(event.dataTransfer.files));
    },
    [disabled, submitFiles],
  );

  const onPaste = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      if (disabled) return;
      const files = filesFromList(event.clipboardData.files);
      if (files.length === 0) return;
      event.preventDefault();
      submitFiles(files);
    },
    [disabled, submitFiles],
  );

  return {
    isDraggingFiles,
    getDropzoneProps: () => ({
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
      onPaste,
    }),
  };
};
