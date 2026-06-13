// Component representing link editor popover,
// shown when editing an existing link or inserting a new link in the document.
"use client";

import { Editor } from "@tiptap/react";
import { ExternalLink, Link as LinkIcon, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { stopUndoCapturing } from "./undoCapture";

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
    stopUndoCapturing(editor);
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    stopUndoCapturing(editor);
    onClose();
  };

  const submitLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const href = normalizeLinkUrl(url);
    if (!href) {
      toast.error("Invalid URL");
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
      stopUndoCapturing(editor);
      editor.chain().focus().insertContent({ type: "text", text: label, marks: [{ type: "link", attrs }] }).run();
      stopUndoCapturing(editor);
      onClose();
      return;
    }
    if (!empty && displayText.trim()) {
      stopUndoCapturing(editor);
      editor.chain().focus().deleteSelection().insertContent({ type: "text", text: label, marks: [{ type: "link", attrs }] }).run();
      stopUndoCapturing(editor);
      onClose();
      return;
    }
    stopUndoCapturing(editor);
    editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
    stopUndoCapturing(editor);
    onClose();
  };

  if (!mounted) return null;

  const inputCls = "mt-1 h-9 w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] px-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors";

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[90] w-80 rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-3"
      style={{ left: position.left, top: position.top, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[0.6875rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
          <LinkIcon className="h-3.5 w-3.5" />
          Link
        </div>
        <button type="button" onClick={onClose} className="rounded-[4px] p-1 text-[#ABABAB] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <form onSubmit={submitLink} className="space-y-3">
        <label className="block text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
          Display Text
          <input
            type="text"
            value={displayText}
            onChange={(event) => setDisplayText(event.target.value)}
            placeholder="Enter display text"
            className={inputCls}
          />
        </label>

        <label className="block text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
          URL
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com, mailto:, tel:"
            autoFocus
            className={inputCls}
          />
        </label>

        <label className="flex items-center gap-2 text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] cursor-pointer">
          <input
            type="checkbox"
            checked={openNewTab}
            onChange={(event) => setOpenNewTab(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-[#EAEAEA] accent-[#2563EB]"
          />
          Open in new tab
        </label>

        <div className="flex items-center justify-between gap-2 pt-1">
          {isEditingExistingLink ? (
            <button
              type="button"
              onClick={removeLink}
              className="inline-flex h-8 items-center gap-1.5 rounded-[4px] px-2 text-[0.6875rem] font-semibold text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Link
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 text-[0.6875rem] font-semibold text-white hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
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
