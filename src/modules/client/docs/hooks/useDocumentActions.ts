import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import { documentService } from "../services/documentService";
import { DocumentItem } from "../types/document.type";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return res?.data?.message || res?.data?.error || fallback;
  }
  return fallback;
}

export function useDocumentActions(refetch: () => void) {
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const handleDelete = useCallback(
    async (doc: DocumentItem) => {
      setDeleting(true);
      try {
        await documentService.delete(doc._id);
        toast.success("Document deleted");
        refetch();
      } catch {
        toast.error("Delete document failed");
      } finally {
        setDeleting(false);
      }
    },
    [refetch],
  );

  const handleRename = useCallback(
    async (doc: DocumentItem, newName: string): Promise<boolean> => {
      const nextName = newName.trim();
      if (!nextName) {
        toast.error("Document name is required");
        return false;
      }
      if (nextName === doc.name) return true;

      setRenaming(true);
      try {
        await documentService.rename(doc._id, nextName);
        toast.success("Document renamed");
        refetch();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, "Rename document failed"));
        return false;
      } finally {
        setRenaming(false);
      }
    },
    [refetch],
  );

  return { deleting, renaming, handleDelete, handleRename };
}
