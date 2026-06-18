// Component representing the find and replace panel in the document editor.
"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { Search, Replace, X } from "lucide-react";

interface FindReplacePanelProps {
  editor: Editor | null;
  onClose: () => void;
}

export default function FindReplacePanel({ editor, onClose }: FindReplacePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCount, setMatchCount] = useState(0);

  // Sync search and replace term with Tiptap
  useEffect(() => {
    if (!editor) return;
    editor.commands.setSearchTerm(searchTerm);
    editor.commands.setReplaceTerm(replaceTerm);

    // Force a re-render of ProseMirror decorations
    editor.view.dispatch(editor.view.state.tr);

    // Get number of results from storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (editor.storage as any).searchAndReplace?.results || [];
    setMatchCount(results.length);
  }, [searchTerm, replaceTerm, editor]);

  // Clean search on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.commands.setSearchTerm("");
        editor.view.dispatch(editor.view.state.tr);
      }
    };
  }, [editor]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceTerm(e.target.value);
  };

  const handleReplace = () => {
    if (!editor || matchCount === 0) return;
    editor.commands.replace();
    // Recalculate results count
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = (editor.storage as any).searchAndReplace?.results || [];
      setMatchCount(results.length);
    }, 50);
  };

  const handleReplaceAll = () => {
    if (!editor || matchCount === 0) return;
    editor.commands.replaceAll();
    setTimeout(() => {
      setMatchCount(0);
    }, 50);
  };

  return (
    <div className="absolute top-4 right-4 z-40 bg-white dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-lg p-4 w-[320px] flex flex-col gap-3 transition-all print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-indigo-500" />
          Find & Replace
        </span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Find Input */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase">Find</label>
        <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40 focus-within:border-indigo-500 transition-all bg-gray-50 dark:bg-gray-900/50">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Enter search term..."
            className="w-full text-xs border-none outline-none bg-transparent p-0 focus:ring-0 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
          />
          {searchTerm && (
            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap shrink-0 ml-1.5">
              {matchCount} results
            </span>
          )}
        </div>
      </div>

      {/* Replace Input */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-bold text-gray-400 uppercase">Replace with</label>
        <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40 focus-within:border-indigo-500 transition-all bg-gray-50 dark:bg-gray-900/50">
          <input
            type="text"
            value={replaceTerm}
            onChange={handleReplaceChange}
            placeholder="Enter replacement..."
            className="w-full text-xs border-none outline-none bg-transparent p-0 focus:ring-0 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end mt-1.5">
        <button
          onClick={handleReplace}
          disabled={matchCount === 0}
          className="px-3 py-1.5 text-[11px] font-semibold border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
        >
          <Replace className="w-3.5 h-3.5" />
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={matchCount === 0}
          className="px-3 py-1.5 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Replace all
        </button>
      </div>
    </div>
  );
}
