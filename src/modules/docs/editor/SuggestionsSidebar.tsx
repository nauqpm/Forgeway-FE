// Component representing the sidebar displaying suggested changes in the document editor,
// allowing users to view, accept, or reject suggestions.
"use client";

import React, { useMemo } from "react";
import { Check, X, FileText } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface SuggestionsSidebarProps {
  editor: Editor | null;
}

interface SuggestionItem {
  id: string;
  type: "insert" | "delete";
  text: string;
  userId: string;
  userName: string;
  createdAt: string;
  from: number;
  to: number;
}

export default function SuggestionsSidebar({ editor }: SuggestionsSidebarProps) {
  // Extract suggestions from the editor document in real-time
  const suggestions = useMemo((): SuggestionItem[] => {
    if (!editor) return [];

    const { doc } = editor.state;
    const { suggestInsert, suggestDelete } = editor.state.schema.marks;
    if (!suggestInsert || !suggestDelete) return [];

    const suggestionsMap: Record<string, SuggestionItem> = {};

    doc.descendants((node, pos) => {
      if (!node.isText) return;

      const insertMark = node.marks.find((m) => m.type === suggestInsert);
      const deleteMark = node.marks.find((m) => m.type === suggestDelete);

      if (insertMark) {
        const { id, userId, userName, createdAt } = insertMark.attrs;
        if (id) {
          if (!suggestionsMap[id]) {
            suggestionsMap[id] = {
              id,
              type: "insert",
              text: node.text || "",
              userId,
              userName,
              createdAt,
              from: pos,
              to: pos + node.nodeSize,
            };
          } else {
            suggestionsMap[id].text += node.text || "";
            suggestionsMap[id].to = Math.max(suggestionsMap[id].to, pos + node.nodeSize);
          }
        }
      } else if (deleteMark) {
        const { id, userId, userName, createdAt } = deleteMark.attrs;
        if (id) {
          if (!suggestionsMap[id]) {
            suggestionsMap[id] = {
              id,
              type: "delete",
              text: node.text || "",
              userId,
              userName,
              createdAt,
              from: pos,
              to: pos + node.nodeSize,
            };
          } else {
            suggestionsMap[id].text += node.text || "";
            suggestionsMap[id].to = Math.max(suggestionsMap[id].to, pos + node.nodeSize);
          }
        }
      }
    });

    return Object.values(suggestionsMap);
  }, [editor]);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const handleActivateSuggestion = (from: number, to: number) => {
    if (editor) {
      editor.commands.setTextSelection({ from, to });
      editor.commands.scrollIntoView();
    }
  };

  const handleAccept = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editor) {
      editor.commands.acceptSuggestion(id);
    }
  };

  const handleReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editor) {
      editor.commands.rejectSuggestion(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 text-slate-700 dark:text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <FileText className="w-[18px] h-[18px] text-emerald-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Suggested Changes</h3>
          {suggestions.length > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              {suggestions.length}
            </span>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 mx-3 mt-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-xs text-emerald-600 dark:text-emerald-400">
        Review suggested changes and accept or reject to apply them to the original document.
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-gray-900 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-300 dark:text-slate-700" />
            </div>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              No suggestions yet
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[180px]">
              Switch to Suggesting mode in the header and make edits to create suggestions.
            </p>
          </div>
        ) : (
          suggestions.map((item) => (
            <div
              key={item.id}
              onClick={() => handleActivateSuggestion(item.from, item.to)}
              className="group p-3 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100/80 dark:hover:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800 rounded-xl transition-all duration-200 cursor-pointer"
            >
              {/* Suggestion metadata */}
              <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {item.userName ? item.userName.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 truncate leading-tight">
                    {item.userName || "Anonymous"}
                  </p>
                  <p className="text-[9px] opacity-75">{formatTime(item.createdAt)}</p>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    item.type === "insert"
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {item.type === "insert" ? "Insert" : "Delete"}
                </span>
              </div>

              {/* Snippet text */}
              <div className="mb-3 p-2 bg-white dark:bg-gray-950 border border-gray-200/50 dark:border-gray-800/50 rounded-lg text-xs">
                {item.type === "insert" ? (
                  <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 px-1 border-b border-emerald-400 font-medium">
                    {item.text}
                  </span>
                ) : (
                  <span className="line-through text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/10 px-1">
                    {item.text}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleReject(e, item.id)}
                  className="py-1 px-2.5 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={(e) => handleAccept(e, item.id)}
                  className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold shadow-sm transition-all duration-200 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Accept</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
