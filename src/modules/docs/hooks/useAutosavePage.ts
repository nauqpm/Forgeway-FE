// Hook managing document editor auto-save,
// monitors changes and automatically saves document content after inactivity,
// provides saving state and allows flushing updates immediately when needed.
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import DOMPurify from "dompurify";
import * as Yjs from "yjs";
import { pagesService } from "../services/pages.service";
import type { Document as WorkspaceDocument } from "../types/docs.type";

const sanitizeEditorHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: [
      "style",
      "target",
      "rel",
      "colspan",
      "rowspan",
      "width",
      "height",
      "data-align",
    ],
  });

interface UseAutosavePageProps {
  documentId: string | undefined;
  editor: Editor | null;
  ydoc: Yjs.Doc | null;
  mode: "read" | "edit";
  onSaveSuccess?: (updatedDoc: WorkspaceDocument) => void;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosavePage({
  documentId,
  editor,
  ydoc,
  mode,
  onSaveSuccess,
}: UseAutosavePageProps) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPendingChangesRef = useRef(false);

  const performSave = useCallback(async () => {
    if (!documentId || !editor || !ydoc || editor.isDestroyed || ydoc.isDestroyed) return;

    setStatus("saving");
    try {
      const html = sanitizeEditorHtml(editor.getHTML());
      const json = JSON.stringify(editor.getJSON());
      const plainText = editor.getText();
      const yjsState = Array.from(Yjs.encodeStateAsUpdate(ydoc));

      const updatedDoc = await pagesService.syncPage(documentId, {
        content: html,
        contentJson: json,
        plainTextSnapshot: plainText,
        yjsState,
      });

      setStatus("saved");
      if (onSaveSuccess) {
        onSaveSuccess(updatedDoc);
      }

      hasPendingChangesRef.current = false;
    } catch (err) {
      console.error("Autosave sync failed:", err);
      setStatus("error");
    }
  }, [documentId, editor, ydoc, onSaveSuccess]);

  const scheduleSave = useCallback(() => {
    hasPendingChangesRef.current = true;
    setStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      void performSave();
    }, 3000);
  }, [performSave]);

  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!hasPendingChangesRef.current) {
      return;
    }

    await performSave();
  }, [performSave]);

  // Listen to editor and title changes
  useEffect(() => {
    if (mode !== "edit" || !editor || !ydoc || !documentId) {
      return;
    }

    const handleEditorUpdate = () => {
      scheduleSave();
    };

    const yTitle = ydoc.getText("title");
    const handleTitleUpdate = (event: Yjs.YTextEvent) => {
      // Only trigger if changes are local
      if (event.transaction.local) {
        scheduleSave();
      }
    };

    editor.on("update", handleEditorUpdate);
    yTitle.observe(handleTitleUpdate);

    return () => {
      editor.off("update", handleEditorUpdate);
      yTitle.unobserve(handleTitleUpdate);
    };
  }, [editor, ydoc, mode, documentId, scheduleSave]);

  // Flush pending save on cleanups or when documentId/mode changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        void performSave();
      }
    };
  }, [documentId, mode, performSave]);

  useEffect(() => {
    if (mode !== "edit") {
      hasPendingChangesRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      setStatus("idle");
    }
  }, [mode, documentId]);

  return { status, flushSave };
}
