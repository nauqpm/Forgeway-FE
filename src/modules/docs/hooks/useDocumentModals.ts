import { useCallback, useEffect, useState } from "react";
import { DocumentItem } from "../types/document.type";

export function useDocumentModals() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<DocumentItem | null>(null);
  const [renameName, setRenameName] = useState("");
  const [linkingDoc, setLinkingDoc] = useState<DocumentItem | null>(null);

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const openRenameDialog = useCallback((doc: DocumentItem) => {
    setRenameTarget(doc);
    setRenameName(doc.name);
  }, []);

  const closeRenameDialog = useCallback(
    (isRenaming: boolean) => {
      if (isRenaming) return;
      setRenameTarget(null);
      setRenameName("");
    },
    [],
  );

  const clearRenameDialog = useCallback(() => {
    setRenameTarget(null);
    setRenameName("");
  }, []);

  return {
    openMenuId,
    setOpenMenuId,
    editingDoc,
    setEditingDoc,
    viewingDoc,
    setViewingDoc,
    deleteTarget,
    setDeleteTarget,
    renameTarget,
    renameName,
    setRenameName,
    linkingDoc,
    setLinkingDoc,
    openRenameDialog,
    closeRenameDialog,
    clearRenameDialog,
  };
}
