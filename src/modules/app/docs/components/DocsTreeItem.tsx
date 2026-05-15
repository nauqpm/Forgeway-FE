"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FileText, Plus, MoreHorizontal, Trash, Edit2 } from "lucide-react";
import { useDocsStore } from "../store/docs.store";
import { Document } from "../types/docs.type";
import DocsTree from "./DocsTree";

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
    renameDocument
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
    if (confirm("Bạn có chắc muốn xoá tài liệu này và tất cả tài liệu con?")) {
      deleteDocument(doc.id);
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
    <li>
      <div 
        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
          isSelected ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
        onClick={handleSelect}
      >
        <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
          <button 
            className={`w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 ${isSelected ? "hover:bg-indigo-100 text-indigo-500" : ""} transition-colors`}
            onClick={handleToggle}
            style={{ visibility: hasChildren ? "visible" : "hidden" }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          <FileText className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-indigo-600" : "text-gray-400"}`} />
          
          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-sm outline-none"
            />
          ) : (
            <span className="truncate text-sm font-medium">{doc.title}</span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0 transition-opacity relative" ref={menuRef}>
          <button 
            onClick={handleAddChild}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Thêm trang con"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" /> Đổi tên
              </button>
              <button 
                onClick={handleDelete}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash className="w-3.5 h-3.5" /> Xoá
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render children animated using tailwind arbitrary variants (max-height for basic accordion effect if possible, but conditionally rendering is simpler) */}
      <div 
        className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? "max-h-[1000px] opacity-100 mt-0.5" : "max-h-0 opacity-0"}`}
      >
        {hasChildren && <DocsTree docs={children} spaceId={spaceId} level={level + 1} />}
      </div>
    </li>
  );
}
