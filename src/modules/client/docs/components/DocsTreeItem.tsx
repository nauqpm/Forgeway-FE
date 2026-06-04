"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  FileText,
  Plus,
  MoreHorizontal,
  Trash,
  Edit2,
  Loader2,
} from "lucide-react";
import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import DocsTree from "./DocsTree";
import { motion, AnimatePresence } from "framer-motion";

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
    documents,
    selectedDocumentId,
    expandedNodes,
    loadedChildrenOf,
    toggleExpand,
    selectDocument,
    createDocument,
    deleteDocument,
    renameDocument,
    loadChildren,
  } = useDocsStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = documents.filter((d) => d.parentId === doc.id);
  const hasLoadedChildren = loadedChildrenOf.includes(doc.id);
  // Show expand arrow optimistically (always show until we know it has no children)
  const hasChildren = children.length > 0 || !hasLoadedChildren;
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

    // If expanding and children not yet loaded → lazy load
    if (!isExpanded && !hasLoadedChildren) {
      setIsLoadingChildren(true);
      await loadChildren(doc.id);
      setIsLoadingChildren(false);
    }

    toggleExpand(doc.id);
  };

  const handleSelect = () => {
    selectDocument(doc.id);
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If children not loaded yet, load them first
    if (!hasLoadedChildren) {
      await loadChildren(doc.id);
    }

    const newDoc = await createDocument(workspaceId, doc.id);
    if (!isExpanded) toggleExpand(doc.id);
    if (newDoc) selectDocument(newDoc.id);
    setShowMenu(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this document and all sub-pages?")) {
      await deleteDocument(doc.id);
    }
    setShowMenu(false);
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
          group relative flex items-center justify-between px-3 py-1.5 cursor-pointer transition-all duration-200
          ${
            isSelected
              ? "bg-[#E6EFFC] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400"
              : "text-[#42526E] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
          }
          rounded-lg mx-1 mb-0.5
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Active Indicator */}
        {isSelected && (
          <motion.div
            layoutId="activeDocIndicator"
            className="absolute left-0 w-1 h-5 bg-[#0052CC] dark:bg-blue-400 rounded-r-full"
          />
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${isSelected ? "text-[#0052CC] dark:text-blue-400" : "text-gray-400 dark:text-gray-600"} ${hasChildren ? "hover:bg-gray-200/50 dark:hover:bg-gray-800" : "opacity-0 cursor-default"}`}
            onClick={handleToggle}
          >
            {isLoadingChildren ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </button>

          <FileText
            className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#0052CC] dark:text-blue-400" : "text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400"}`}
          />

          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-[#4C9AFF] dark:border-blue-500 rounded-md px-2 py-0.5 text-[13px] outline-none shadow-sm dark:text-gray-200"
            />
          ) : (
            <span
              className={`truncate text-[13px] leading-tight py-0.5 ${isSelected ? "font-bold" : "font-medium"}`}
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
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-[#0052CC] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-all shadow-none hover:shadow-sm"
            title="Thêm trang con"
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
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-all shadow-none hover:shadow-sm"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="fixed w-44 bg-white dark:bg-gray-900 rounded-xl shadow-[0_10px_38px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 py-1.5 z-[100]"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#42526E] dark:text-gray-300 hover:bg-[#F4F5F7] dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />{" "}
                  Đổi tên
                </button>
                <div className="my-1 border-t border-gray-50 dark:border-gray-800" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2.5 transition-colors"
                >
                  <Trash className="w-3.5 h-3.5" /> Xóa
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
    </li>
  );
}
