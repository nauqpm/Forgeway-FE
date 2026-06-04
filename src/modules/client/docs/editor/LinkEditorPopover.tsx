"use client";

import { Editor } from "@tiptap/react";
import { ExternalLink, Link as LinkIcon, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";

type LinkEditorPopoverProps = {
  editor: Editor;
  anchorEl: HTMLElement | null;
  onClose: () => void;
};

type LinkAttrs = {
  href: string;
  target?: string | null;
  rel?: string | null;
};

const POPOVER_WIDTH = 320;
const VIEWPORT_MARGIN = 12;

const normalizeLinkUrl = (raw: string) => {
  const input = raw.trim();
  if (!input) return "";

  if (/^(mailto:|tel:)/i.test(input)) return input;

  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return "";
  }
};

const getSelectedText = (editor: Editor) => {
  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to, " ").trim();
};

export default function LinkEditorPopover({ editor, anchorEl, onClose }: LinkEditorPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [displayText, setDisplayText] = useState("");
  const [url, setUrl] = useState("");
  const [openNewTab, setOpenNewTab] = useState(true);
  const [isEditingExistingLink, setIsEditingExistingLink] = useState(false);

  const updatePosition = useCallback(() => {
    if (!anchorEl) return;

    const rect = anchorEl.getBoundingClientRect();
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN,
    );
    setPosition({ left, top: rect.bottom + 8 });
  }, [anchorEl]);

  useEffect(() => {
    const selectedText = getSelectedText(editor);
    const attrs = editor.getAttributes("link") as Partial<LinkAttrs>;
    const hasActiveLink = editor.isActive("link");

    setDisplayText(selectedText);
    setUrl(attrs.href || "");
    setOpenNewTab(attrs.target !== null);
    setIsEditingExistingLink(hasActiveLink);
  }, [editor]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target) && !anchorEl?.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    setMounted(true);
    updatePosition();
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorEl, onClose, updatePosition]);

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  const submitLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const href = normalizeLinkUrl(url);
    if (!href) {
      toast.error("URL không hợp lệ");
      return;
    }

    const attrs: LinkAttrs = {
      href,
      target: openNewTab ? "_blank" : null,
      rel: openNewTab ? "noopener noreferrer" : null,
    };
    const label = displayText.trim() || href;
    const { empty } = editor.state.selection;

    if (empty && !editor.isActive("link")) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: label,
          marks: [{ type: "link", attrs }],
        })
        .run();
      onClose();
      return;
    }

    if (!empty && displayText.trim()) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({
          type: "text",
          text: label,
          marks: [{ type: "link", attrs }],
        })
        .run();
      onClose();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[90] w-[320px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      style={{ left: position.left, top: position.top }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
          <LinkIcon className="h-3.5 w-3.5" />
          Link
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <form onSubmit={submitLink} className="space-y-3">
        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          Display Text
          <input
            type="text"
            value={displayText}
            onChange={(event) => setDisplayText(event.target.value)}
            placeholder="Nhập text hiển thị"
            className="mt-1 h-9 w-full rounded border border-gray-200 bg-white px-2 text-sm text-gray-900 outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </label>

        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
          URL
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com, mailto:, tel:"
            autoFocus
            className="mt-1 h-9 w-full rounded border border-gray-200 bg-white px-2 text-sm text-gray-900 outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={openNewTab}
            onChange={(event) => setOpenNewTab(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300"
          />
          Open in new tab
        </label>

        <div className="flex items-center justify-between gap-2 pt-1">
          {isEditingExistingLink ? (
            <button
              type="button"
              onClick={removeLink}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Link
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Apply
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
