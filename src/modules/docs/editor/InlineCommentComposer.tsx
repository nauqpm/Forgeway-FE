"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, X } from "lucide-react";

interface InlineCommentComposerProps {
  top: number;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
}

export default function InlineCommentComposer({
  top,
  onSubmit,
  onCancel,
}: InlineCommentComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="absolute left-0 right-0 pointer-events-auto"
      style={{ top: `${Math.max(0, top)}px` }}
    >
      <div className="rounded-xl border border-indigo-200 bg-white p-3 shadow-lg dark:border-indigo-900/60 dark:bg-gray-950">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
            Comment
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <textarea
          ref={inputRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
            if (event.key === "Escape") {
              onCancel();
            }
          }}
          rows={3}
          placeholder="Enter comment..."
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[12px] text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        />
        <div className="mt-2 flex justify-end gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!content.trim() || isSubmitting}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
