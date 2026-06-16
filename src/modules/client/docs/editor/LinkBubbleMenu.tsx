// Component representing bubble menu shown when a link is selected in the editor.
"use client";

import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Copy, Check, Pencil, Unlink, ExternalLink, Loader2 } from "lucide-react";
import api from '@/lib/axiosIns';
import { toast } from "react-hot-toast";

interface LinkBubbleMenuProps {
  editor: Editor;
}

const normalizeLinkUrl = (raw: string) => {
  const input = raw.trim();
  if (!input) return "";
  if (/^(javascript:|data:)/i.test(input)) {
    return "";
  }
  if (/^(mailto:|tel:)/i.test(input)) return input;
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return "";
  }
};

export default function LinkBubbleMenu({ editor }: LinkBubbleMenuProps) {
  const [previewData, setPreviewData] = useState<{
    title: string;
    description: string;
    image: string;
    url: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const attrs = editor.getAttributes("link");
  const href = attrs.href;

  useEffect(() => {
    if (!href) {
      setPreviewData(null);
      setIsEditing(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    api.get(`/pages/link-preview?url=${encodeURIComponent(href)}`)
      .then((res) => {
        if (isMounted) {
          setPreviewData(res.data);
        }
      })
      .catch((err) => {
        console.error("Link preview error:", err);
        if (isMounted) {
          setPreviewData({
            title: href,
            description: "",
            image: "",
            url: href,
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [href]);

  // Bubble menu trigger condition
  const shouldShow = ({ editor }: { editor: Editor }) => {
    return editor.isActive("link");
  };

  const handleCopy = () => {
    if (!href) return;
    navigator.clipboard.writeText(href);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const handleStartEdit = () => {
    setEditUrl(href || "");
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ").trim();
    setEditLabel(selectedText || href || "");
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeLinkUrl(editUrl);
    if (!normalized) {
      toast.error("Invalid URL");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .insertContent({
        type: "text",
        text: editLabel.trim() || normalized,
        marks: [
          {
            type: "link",
            attrs: {
              href: normalized,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          },
        ],
      })
      .run();

    setIsEditing(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      options={{
        placement: "bottom-start",
        offset: 8,
      }}
    >
      <div className="w-80 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden p-3 text-sm text-gray-700 dark:text-gray-300">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">
                Display text
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Enter display text"
                className="w-full h-8 px-2 border border-gray-200 dark:border-gray-800 rounded bg-transparent text-xs outline-none focus:border-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">
                Link URL
              </label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="Enter URL (https://...)"
                autoFocus
                className="w-full h-8 px-2 border border-gray-200 dark:border-gray-800 rounded bg-transparent text-xs outline-none focus:border-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-xs font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Apply
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {/* OpenGraph Preview Card */}
            {loading ? (
              <div className="flex items-center justify-center py-4 text-gray-400 dark:text-gray-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs">Loading preview...</span>
              </div>
            ) : previewData ? (
              <div className="flex gap-2 bg-gray-50 dark:bg-gray-950 p-2 rounded-md border border-gray-100 dark:border-gray-850">
                {previewData.image && (
                  <img
                    src={previewData.image}
                    alt={previewData.title}
                    className="w-16 h-16 object-cover rounded border border-gray-200/50 dark:border-gray-800 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 leading-snug line-clamp-1"
                  >
                    {previewData.title || href}
                    <ExternalLink className="w-3 h-3 shrink-0 inline" />
                  </a>
                  {previewData.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-normal mt-0.5">
                      {previewData.description}
                    </p>
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                    {href}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-2 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  title="Copy"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleStartEdit}
                  title="Edit"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-500 dark:text-gray-400 flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
              <button
                onClick={handleUnlink}
                title="Unlink"
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded transition-colors flex items-center gap-1"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Unlink</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
