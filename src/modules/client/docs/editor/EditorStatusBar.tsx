// Component displaying the status bar of the editor, including word count and character count.
// Updates automatically when editor content changes or cursor moves.
"use client";

import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";

interface EditorStatusBarProps {
  editor: Editor | null;
}

export default function EditorStatusBar({ editor }: EditorStatusBarProps) {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const updateCounts = () => {
      const text = editor.getText();
      const chars = text.length;
      // Clean up whitespace to accurately count words
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setCharCount(chars);
      setWordCount(words);
    };

    updateCounts();
    editor.on("update", updateCounts);
    editor.on("selectionUpdate", updateCounts);

    return () => {
      editor.off("update", updateCounts);
      editor.off("selectionUpdate", updateCounts);
    };
  }, [editor]);

  return (
    <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 print:hidden select-none">
      <div className="flex items-center gap-1">
        <span>Words:</span>
        <span className="text-gray-800 dark:text-gray-200">{wordCount}</span>
      </div>
      <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800" />
      <div className="flex items-center gap-1">
        <span>Characters:</span>
        <span className="text-gray-800 dark:text-gray-200">{charCount}</span>
      </div>
    </div>
  );
}
