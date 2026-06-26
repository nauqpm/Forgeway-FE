// Main component of the document editor, 
// managing edit/read modes, collaboration connection, auto-save, comments, and version history.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDocsStore } from "../store/docs.store";
import { useWorkspaceDocs } from "../hooks/useWorkspaceDocs";
import EditorHeader from "./EditorHeader";
import EditorToolbar from "./EditorToolbar";
import ReadOnlyEditor from "./ReadOnlyEditor";
import CollaborativeEditor from "./CollaborativeEditor";
import { WORKSPACE_PERMISSIONS } from "@/modules/workspace/shared/constants/workspacePermissions";
import { useWorkspacePermission } from "@/modules/workspace/shared/hooks/useWorkspacePermission";
import { useEditorConnectionStatus } from "../hooks/useEditorConnectionStatus";
import { useEditorTitleCollaboration } from "../hooks/useEditorTitleCollaboration";
import { useEditorLifecycle } from "../hooks/useEditorLifecycle";
import { useCollaborativePage } from "../hooks/useCollaborativePage";
import { useAutosavePage } from "../hooks/useAutosavePage";
import { usePageComments } from "../hooks/usePageComments";
import { useVersionHistory } from "../hooks/useVersionHistory";
import { pagesService } from "../services/pages.service";
import type { Document as WorkspaceDocument } from "../types/docs.type";
import { toast } from "react-hot-toast";

import EditorPageLayout from "./EditorPageLayout";
import PageCanvas from "./PageCanvas";
import DocumentOutline from "./DocumentOutline";
import FindReplacePanel from "./FindReplacePanel";
import EditorStatusBar from "./EditorStatusBar";
import TableContextMenu from "./TableContextMenu";
import LinkBubbleMenu from "./LinkBubbleMenu";
import CommentsSidebar from "./CommentsSidebar";
import VersionHistorySidebar from "./VersionHistorySidebar";
import SuggestionsSidebar from "./SuggestionsSidebar";
import { useAuthStore } from "@/modules/auth/shared/stores/authStore";

import { extractApiError } from "@/shared/utils/apiError";

export type EditorMode = "read" | "edit";

const normalizeTitle = (value: string) => value.trim().toLocaleLowerCase();

export default function TiptapEditor({ workspaceId }: { workspaceId: string }) {
  const { selectedDocumentId } = useDocsStore();
  const { documents, updateDocument, saveDocument } = useWorkspaceDocs(workspaceId);
  const document = documents.find((d) => d.id === selectedDocumentId);
  const persistedPageId =
    selectedDocumentId && !selectedDocumentId.startsWith("temp-")
      ? selectedDocumentId
      : undefined;
  const { hasPermission } = useWorkspacePermission(document?.workspaceId ?? "");
  const canEditPage = hasPermission(WORKSPACE_PERMISSIONS.PAGE_EDIT);

  const [mode, setMode] = useState<EditorMode>("read");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isImportingDocx, setIsImportingDocx] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [tableMenu, setTableMenu] = useState<{ x: number; y: number } | null>(null);
  
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [activeRightSidebar, setActiveRightSidebar] = useState<"comments" | "versions" | "suggestions">("comments");
  const [isSuggestionModeActive, setIsSuggestionModeActive] = useState(false);
  const [workspacePages, setWorkspacePages] = useState<{ id: string; title: string }[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  useEffect(() => {
    const handleCloseMenu = () => setTableMenu(null);
    window.addEventListener("click", handleCloseMenu);
    return () => window.removeEventListener("click", handleCloseMenu);
  }, []);

  // ── Hooks ──────────────────────────────────────────────────
  const connectionStatus = useEditorConnectionStatus();

  const {
    readEditor,
    editEditor,
    createCollaborativeEditor,
    destroyCollaborativeEditor,
  } = useEditorLifecycle(
    document?.content || "",
    document?.workspaceId,
    document?.id,
    document?.title
  );

  useEffect(() => {
    if (readEditor && document?.id && mode === "read") {
      readEditor.commands.setContent(document.content || "");
    }
  }, [readEditor, document?.content, document?.id, mode]);

  const {
    ydoc,
    awareness,
    enterEditMode,
    exitEditMode,
  } = useCollaborativePage({
    selectedDocumentId: selectedDocumentId || undefined,
    initialTitle: document?.title || "",
    initialContent: document?.content || "",
    mode,
    setMode,
    createCollaborativeEditor,
    destroyCollaborativeEditor,
  });

  const { editTitle, handleTitleInput, setEditTitle } = useEditorTitleCollaboration(
    ydoc,
    document?.title || ""
  );

  useEffect(() => {
    if (!document?.workspaceId) {
      setWorkspacePages([]);
      return;
    }
    setWorkspacePages(
      documents
        .filter((page) => page.workspaceId === document.workspaceId)
        .map((page) => ({ id: page.id, title: page.title })),
    );
  }, [document?.workspaceId, documents]);

  useEffect(() => {
    if (!document) {
      setTitleError(null);
      return;
    }

    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      setTitleError(null);
      return;
    }

    const isDuplicate = workspacePages.some(
      (page) =>
        page.id !== document.id &&
        normalizeTitle(page.title) === normalizeTitle(nextTitle),
    );

    if (isDuplicate) {
      setTitleError("A document with this name already exists in this workspace");
      return;
    }

    setTitleError(null);
  }, [document, editTitle, workspacePages]);

  const resetTitleToSaved = useCallback(
    (message?: string) => {
      const savedTitle = document?.title || "";

      if (ydoc) {
        const yTitle = ydoc.getText("title");
        ydoc.transact(() => {
          yTitle.delete(0, yTitle.length);
          yTitle.insert(0, savedTitle);
        });
      } else {
        setEditTitle(savedTitle);
      }

      setTitleError(null);
      if (message) {
        toast.error(message);
      }
    },
    [document?.title, setEditTitle, ydoc],
  );

  const { status: saveStatus, flushSave } = useAutosavePage({
    documentId: persistedPageId,
    editor: mode === "edit" ? editEditor : null,
    ydoc,
    mode,
    onSaveSuccess: useCallback((updatedDoc: WorkspaceDocument) => {
      if (selectedDocumentId) {
        updateDocument(selectedDocumentId, {
          title: updatedDoc.title,
          content: updatedDoc.content,
        });
      }
    }, [selectedDocumentId, updateDocument]),
  });

  // ── Comments Hook ──────────────────────────────────────────
  const {
    comments: visibleComments,
    isLoading: commentsLoading,
    activeCommentId,
    setActiveCommentId,
    showResolved,
    setShowResolved,
    resolvedCount,
    openCount,
    addComment,
    replyToComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
  } = usePageComments({
    workspaceId,
    pageId: persistedPageId,
    enabled: !!workspaceId && !!persistedPageId,
  });

  // ── Version History Hook ───────────────────────────────────
  const {
    versions,
    isLoading: versionsLoading,
    createVersion,
    restoreVersion,
  } = useVersionHistory({
    pageId: persistedPageId,
    enabled: !!persistedPageId,
  });

  const handleToggleVersionHistory = useCallback(() => {
    if (rightSidebarOpen && activeRightSidebar === "versions") {
      setRightSidebarOpen(false);
    } else {
      setActiveRightSidebar("versions");
      setRightSidebarOpen(true);
    }
  }, [rightSidebarOpen, activeRightSidebar]);

  const handleToggleComments = useCallback(() => {
    if (rightSidebarOpen && activeRightSidebar === "comments") {
      setRightSidebarOpen(false);
    } else {
      setActiveRightSidebar("comments");
      setRightSidebarOpen(true);
    }
  }, [rightSidebarOpen, activeRightSidebar]);

  const handleToggleSuggestions = useCallback(() => {
    if (rightSidebarOpen && activeRightSidebar === "suggestions") {
      setRightSidebarOpen(false);
    } else {
      setActiveRightSidebar("suggestions");
      setRightSidebarOpen(true);
    }
  }, [rightSidebarOpen, activeRightSidebar]);

  const handleToggleSuggestionMode = useCallback(() => {
    setIsSuggestionModeActive((prev) => {
      const next = !prev;
      if (next) {
        setActiveRightSidebar("suggestions");
        setRightSidebarOpen(true);
      }
      return next;
    });
  }, []);

  // Sync suggestion mode active state and user to the editor commands
  useEffect(() => {
    if (editEditor && mode === "edit") {
      const user = useAuthStore.getState().user;
      editEditor.commands.setSuggestionMode(isSuggestionModeActive);
      editEditor.commands.setSuggestionUser({
        id: user?.id || "anonymous",
        name: user?.fullName || "Anonymous",
      });
    }
  }, [editEditor, isSuggestionModeActive, mode]);

  // ── Legacy Update (publish) handler ──────────────────────────
  const handleCreateVersion = async (label: string) => {
    if (!document || !selectedDocumentId) return;

    const editor = editEditor;
    if (!editor) return;

    setIsPublishing(true);
    try {
      const title = ydoc?.getText("title").toString() || document.title;
      const html = editor.getHTML(); // Will be sanitized on backend / store update

      const titleSaved = await saveTitle();
      if (!titleSaved) {
        return;
      }

      // Step 1: Flush the latest Yjs/JSON/HTML snapshots before version capture
      await flushSave();

      // Step 2: Sync content and title to page database
      await pagesService.updatePage(selectedDocumentId, {
        title,
        content: html,
      });

      // Step 3: Create a named version
      await createVersion(label);

      toast.success("Version created successfully");
    } catch (error) {
      console.error("Failed to create version:", error);
      toast.error("Failed to create version");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportDocx = useCallback(async () => {
    if (!document) return;
    setIsExportingDocx(true);
    try {
      await pagesService.exportDocx(document.id, document.title);
      toast.success("Word file exported successfully");
    } catch (error) {
      console.error("Export DOCX failed:", error);
      toast.error("Failed to export Word file");
    } finally {
      setIsExportingDocx(false);
    }
  }, [document]);

  const handleImportDocx = useCallback(async (file: File) => {
    if (!editEditor) return;
    
    const confirm = window.confirm("Importing a Word file will overwrite all current page content. Do you want to continue?");
    if (!confirm) return;

    setIsImportingDocx(true);
    try {
      const html = await pagesService.importDocx(file);
      editEditor.commands.setContent(html);
      toast.success("Word file imported successfully");
    } catch (error) {
      console.error("Import DOCX failed:", error);
      toast.error("Failed to import Word file");
    } finally {
      setIsImportingDocx(false);
    }
  }, [editEditor]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (mode !== "edit") return;
    const target = e.target as HTMLElement;
    const cell = target.closest("td, th");
    if (cell && editEditor) {
      e.preventDefault();
      setTableMenu({ x: e.clientX, y: e.clientY });
    }
  }, [mode, editEditor]);

  async function saveTitle() {
    if (!document || !persistedPageId) return true;

    const nextTitle = editTitle.trim() || "Untitled Document";
    if (nextTitle === document.title) {
      setTitleError(null);
      return true;
    }

    const isDuplicate = workspacePages.some(
      (page) =>
        page.id !== document.id &&
        normalizeTitle(page.title) === normalizeTitle(nextTitle),
    );

    if (isDuplicate) {
      resetTitleToSaved(
        "A document with this name already exists in this workspace",
      );
      return false;
    }

    setIsSavingTitle(true);
    try {
      const updatedDoc = await pagesService.updatePage(persistedPageId, {
        title: nextTitle,
      });

      updateDocument(document.id, { title: updatedDoc.title });
      setWorkspacePages((current) => {
        const next = current.filter((page) => page.id !== updatedDoc.id);
        next.push({ id: updatedDoc.id, title: updatedDoc.title });
        return next;
      });
      setTitleError(null);
      return true;
    } catch (error) {
      const message = extractApiError(
        error,
        "Could not rename page",
      );

      if (message.includes("already exists")) {
        resetTitleToSaved(message);
        return false;
      }

      setTitleError(message);
      toast.error(message);
      return false;
    } finally {
      setIsSavingTitle(false);
    }
  }

  const handleToggleMode = async () => {
    if (mode === "edit") {
      const saved = await saveTitle();
      if (!saved) return;

      exitEditMode();
      return;
    }

    if (!document || !selectedDocumentId) return;

    if (selectedDocumentId.startsWith("temp-")) {
      const savedDoc = await saveDocument(selectedDocumentId);
      if (!savedDoc) return;

      enterEditMode({
        documentId: savedDoc.id,
        initialTitle: savedDoc.title,
        initialContent: savedDoc.content,
      });
      return;
    }

    enterEditMode();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("edit") === "true" && mode === "read" && document && selectedDocumentId) {
      const url = new URL(window.location.href);
      url.searchParams.delete("edit");
      window.history.replaceState(null, "", url.pathname + url.search);
      
      void handleToggleMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id, selectedDocumentId]);

  const handleEditorTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleTitleInput(e);
    },
    [handleTitleInput],
  );

  const handleEditorTitleBlur = () => {
    void saveTitle();
  };

  const handleEditorTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveTitle();
      return;
    }

    if (e.key === "Escape" && ydoc) {
      resetTitleToSaved();
    }
  };

  if (!document) return null;

  const activeEditor = mode === "edit" ? editEditor : readEditor;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden relative">
      <EditorHeader
        doc={document}
        mode={mode}
        canEdit={canEditPage}
        connectionStatus={connectionStatus}
        saveStatus={saveStatus}
        isPublishing={isPublishing}
        awareness={awareness}
        onToggleMode={() => {
          void handleToggleMode();
        }}
        onCreateVersion={handleCreateVersion}
        isCommentsOpen={rightSidebarOpen && activeRightSidebar === "comments"}
        onToggleComments={handleToggleComments}
        isVersionHistoryOpen={rightSidebarOpen && activeRightSidebar === "versions"}
        onToggleVersionHistory={handleToggleVersionHistory}
        isSuggestionModeActive={isSuggestionModeActive}
        onToggleSuggestionMode={handleToggleSuggestionMode}
        isSuggestionsOpen={rightSidebarOpen && activeRightSidebar === "suggestions"}
        onToggleSuggestions={handleToggleSuggestions}
        isExportingDocx={isExportingDocx}
        onExportDocx={handleExportDocx}
        isImportingDocx={isImportingDocx}
        onImportDocx={handleImportDocx}
      />

      <div className="flex-1 relative overflow-hidden">
        <EditorPageLayout
          toolbar={
            mode === "edit" ? (
              <EditorToolbar
                editor={activeEditor}
                onToggleFindReplace={() => setFindReplaceOpen(!findReplaceOpen)}
                workspaceId={document?.workspaceId}
                pageId={document?.id}
                pageTitle={document?.title}
              />
            ) : null
          }
          sidebar={<DocumentOutline editor={activeEditor} />}
          statusBar={<EditorStatusBar editor={activeEditor} />}
          rightSidebarOpen={rightSidebarOpen}
          setRightSidebarOpen={setRightSidebarOpen}
          rightSidebar={
            activeRightSidebar === "comments" ? (
              <CommentsSidebar
                pageId={persistedPageId}
                editor={mode === "edit" ? editEditor : null}
                comments={visibleComments}
                isLoading={commentsLoading}
                activeCommentId={activeCommentId}
                showResolved={showResolved}
                resolvedCount={resolvedCount}
                openCount={openCount}
                onSetActiveCommentId={setActiveCommentId}
                onSetShowResolved={setShowResolved}
                onAddComment={addComment}
                onReply={replyToComment}
                onEdit={updateComment}
                onDelete={deleteComment}
                onResolve={resolveComment}
                onUnresolve={unresolveComment}
              />
            ) : activeRightSidebar === "versions" ? (
              <VersionHistorySidebar
                versions={versions}
                isLoading={versionsLoading}
                onRestore={restoreVersion}
              />
            ) : (
              <SuggestionsSidebar
                editor={mode === "edit" ? editEditor : null}
              />
            )
          }
          canvas={
            <PageCanvas>
              {/* Title input inside A4 Page canvas */}
              <div className="mb-8 print:mb-4">
                <input
                  type="text"
                  value={mode === "edit" ? editTitle : document.title}
                  onChange={mode === "edit" ? handleEditorTitleChange : undefined}
                  onBlur={mode === "edit" ? handleEditorTitleBlur : undefined}
                  onKeyDown={mode === "edit" ? handleEditorTitleKeyDown : undefined}
                  readOnly={mode === "read"}
                  className={`w-full text-3xl font-bold border-none outline-none focus:ring-0 bg-transparent text-[#172B4D] dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all tracking-tight leading-tight print:text-black ${
                    titleError ? "text-rose-600 dark:text-rose-400" : ""
                  }`}
                  placeholder="Untitled"
                />
                {mode === "edit" && (
                  <div className="mt-1 min-h-[1.25rem] text-xs">
                    {titleError ? (
                      <span className="text-rose-600 dark:text-rose-400">
                        {titleError}
                      </span>
                    ) : isSavingTitle ? (
                      <span className="text-slate-500 dark:text-slate-400">
                        Saving title...
                      </span>
                    ) : null}
                  </div>
                )}
                <div className="h-px bg-gray-200/60 dark:bg-gray-800 mt-2 print:hidden" />
              </div>

              {/* Editor content inside A4 Page canvas */}
              <div 
                className="min-h-[800px] print:min-h-0 text-gray-900 dark:text-gray-100"
                onContextMenu={handleContextMenu}
              >
                {mode === "read" ? (
                  <ReadOnlyEditor editor={readEditor} />
                ) : (
                  <CollaborativeEditor editor={editEditor} />
                )}
              </div>
            </PageCanvas>
          }
        />

        {/* Floating Find & Replace Panel */}
        {findReplaceOpen && (
          <FindReplacePanel
            editor={activeEditor}
            onClose={() => setFindReplaceOpen(false)}
          />
        )}

        {/* Floating Table Context Menu */}
        {tableMenu && editEditor && mode === "edit" && (
          <TableContextMenu
            editor={editEditor}
            x={tableMenu.x}
            y={tableMenu.y}
            onClose={() => setTableMenu(null)}
          />
        )}

        {/* Floating Link Bubble Menu */}
        {editEditor && mode === "edit" && (
          <LinkBubbleMenu editor={editEditor} />
        )}
      </div>
    </div>
  );
}
