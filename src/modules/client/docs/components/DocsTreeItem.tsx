"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  FileText,
  Plus,
  MoreHorizontal,
  Trash,
  Edit2,
} from "lucide-react";
import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import DocsTree from "./DocsTree";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceDocs } from "../hooks/useWorkspaceDocs";

interface DocsTreeItemProps {
  doc: Document;
  workspaceId: string;
  level: number;
}

export default function DocsTreeItem({
  doc,
  workspaceId,
  level,
}: DocsTreeItemProps) {
  const {
    selectedDocumentId,
    expandedNodes,
    toggleExpand,
    selectDocument,
  } = useDocsStore();
  const { documents, createDocument, deleteDocument, renameDocument } = useWorkspaceDocs(workspaceId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = documents.filter((d) => d.parentId === doc.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.includes(doc.id);
  const isSelected = selectedDocumentId === doc.id;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    toggleExpand(doc.id);
  };

  const handleSelect = () => {
    selectDocument(doc.id, documents);
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newDoc = await createDocument(doc.id);
    if (!isExpanded) toggleExpand(doc.id);
    if (newDoc) selectDocument(newDoc.id, [...documents, newDoc]);
    setShowMenu(false);
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(doc);
    setShowMenu(false);
  };

  const closeDeleteDialog = () => {
    if (!deleting) setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleRenameSubmit = () => {
    if (editTitle.trim()) {
      renameDocument(doc.id, editTitle.trim());
    } else {
      setEditTitle(doc.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") {
      setEditTitle(doc.title);
      setIsEditing(false);
    }
  };

  return (
    <li className="list-none">
      <div
        className={`
          group relative flex items-center justify-between px-3 py-1.5 cursor-pointer transition-all duration-150
          ${
            isSelected
              ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
              : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
          }
          rounded-[6px] mx-1 mb-0.5
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleSelect}
      >
        {isSelected && (
          <motion.div
            layoutId="activeDocIndicator"
            className="absolute left-0 w-1 h-5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-r-full"
          />
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            className={`w-5 h-5 flex items-center justify-center rounded-[3px] transition-colors ${isSelected ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"} ${hasChildren ? "hover:bg-[#EAEAEA]/50 dark:hover:bg-white/6" : "opacity-0 cursor-default"}`}
            onClick={handleToggle}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </button>

          <FileText
            className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B] group-hover:text-[#787774] dark:group-hover:text-[#9B9A97]"}`}
          />

          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-white dark:bg-[#252525] border border-[#2563EB] dark:border-[#3B82F6] rounded-[4px] px-2 py-0.5 text-[0.8125rem] outline-none dark:text-[#E8E8E7]"
            />
          ) : (
            <span
              className={`truncate text-[0.8125rem] leading-tight py-0.5 ${isSelected ? "font-bold" : "font-medium"}`}
            >
              {doc.title}
            </span>
          )}
        </div>

        <div
          className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity relative"
          ref={menuRef}
        >
          <button
            onClick={handleAddChild}
            className="p-1 text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:bg-[#F9F9F8] dark:hover:bg-[#252525] rounded-[4px] transition-colors"
            title="Add sub-page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuPos({ top: rect.bottom + 4, left: rect.right - 176 });
              setShowMenu(!showMenu);
            }}
            className="p-1 text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#787774] dark:hover:text-[#9B9A97] hover:bg-[#F9F9F8] dark:hover:bg-[#252525] rounded-[4px] transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="fixed w-44 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] py-1.5 z-[100]"
                style={{
                  top: menuPos.top,
                  left: menuPos.left,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />{" "}
                  Rename
                </button>
                <div className="my-1 border-t border-[#EAEAEA] dark:border-white/[0.06]" />
                <button
                  onClick={handleOpenDeleteDialog}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] flex items-center gap-2.5 transition-colors"
                >
                  <Trash className="w-3.5 h-3.5" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <DocsTree
              docs={children}
              workspaceId={workspaceId}
              level={level + 1}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          onClick={closeDeleteDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-page-title"
            className="w-full max-w-md rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-5"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] text-[#9F2F2D]">
                <Trash className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="delete-page-title" className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Delete document?
                </h2>
                <p className="mt-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  This will permanently delete{" "}
                  <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                    {deleteTarget.title || "Untitled Document"}
                  </span>
                  {" "}and all sub-pages. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={closeDeleteDialog}
                className="rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] px-4 py-2 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-[6px] bg-[#9F2F2D] px-4 py-2 text-[0.8125rem] font-medium text-white hover:bg-[#8F2927] dark:hover:bg-[#F87171]/80 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
