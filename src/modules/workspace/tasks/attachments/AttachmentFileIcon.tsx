import { Archive, File, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";

interface AttachmentFileIconProps {
  mimeType: string;
  className?: string;
}

export default function AttachmentFileIcon({
  mimeType,
  className = "h-4 w-4",
}: AttachmentFileIconProps) {
  if (mimeType.startsWith("image/")) return <FileImage className={className} />;
  if (mimeType === "application/pdf" || mimeType === "text/plain") {
    return <FileText className={className} />;
  }
  if (mimeType.startsWith("video/")) return <FileVideo className={className} />;
  if (mimeType.startsWith("audio/")) return <FileAudio className={className} />;
  if (mimeType === "application/zip") return <Archive className={className} />;
  return <File className={className} />;
}
