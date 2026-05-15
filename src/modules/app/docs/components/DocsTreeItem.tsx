"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FileText, Plus, MoreHorizontal, Trash, Edit2, Copy } from "lucide-react";
import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import DocsTree from "./DocsTree";
import { motion, AnimatePresence } from "framer-motion";

interface DocsTreeItemProps {
  doc: Document;
  spaceId: string;
  level: number;
}

export default function DocsTreeItem({ doc, spaceId, level }: DocsTreeItemProps) {
  const { 
    documents, 
    selectedDocumentId, 
    expandedNodes, 
    toggleExpand, 
    selectDocument,
    createDocument,
    deleteDocument,
    renameDocument,
    duplicateDocument
  } = useDocsStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = documents.filter(d => d.parentId === doc.id);
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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(doc.id);
  };

  const handleSelect = () => {
    selectDocument(doc.id);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDoc = createDocument(spaceId, doc.id);
    if (!isExpanded) toggleExpand(doc.id);
    selectDocument(newDoc.id);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this document and all sub-pages?")) {
      deleteDocument(doc.id);
    }
    setShowMenu(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDoc = duplicateDocument(doc.id);
    if (newDoc) {
      selectDocument(newDoc.id);
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
          ${isSelected ? "bg-[#E6EFFC] text-[#0052CC]" : "text-[#42526E] hover:bg-gray-50"}
          rounded-lg mx-1 mb-0.5
        `}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
        onClick={handleSelect}
      >
        {/* Active Indicator */}
        {isSelected && (
          <motion.div 
            layoutId="activeDocIndicator"
            className="absolute left-0 w-1 h-5 bg-[#0052CC] rounded-r-full"
          />
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button 
            className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${isSelected ? "text-[#0052CC]" : "text-gray-400"} ${hasChildren ? "hover:bg-gray-200/50" : "opacity-0 cursor-default"}`}
            onClick={handleToggle}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </button>
          
          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#0052CC]" : "text-gray-400 group-hover:text-gray-500"}`} />
          
          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-white border border-[#4C9AFF] rounded-md px-2 py-0.5 text-[13px] outline-none shadow-sm"
            />
          ) : (
            <span className={`truncate text-[13px] leading-tight py-0.5 ${isSelected ? "font-bold" : "font-medium"}`}>
              {doc.title}
            </span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-opacity relative" ref={menuRef}>
          <button 
            onClick={handleAddChild}
            className="p-1 text-gray-400 hover:text-[#0052CC] hover:bg-white rounded-md transition-all shadow-none hover:shadow-sm"
            title="Add sub-page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-all shadow-none hover:shadow-sm"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_10px_38px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.06)] border border-gray-100 py-1.5 z-30"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#42526E] hover:bg-[#F4F5F7] flex items-center gap-2.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Rename
                </button>
                <button 
                  onClick={handleDuplicate}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#42526E] hover:bg-[#F4F5F7] flex items-center gap-2.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" /> Duplicate
                </button>
                <div className="my-1 border-t border-gray-50" />
                <button 
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                >
                  <Trash className="w-3.5 h-3.5" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <DocsTree docs={children} spaceId={spaceId} level={level + 1} />
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
