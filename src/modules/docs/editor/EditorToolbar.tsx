// including buttons and dropdowns to format text, insert images, create tables, align paragraphs, etc.
"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import { Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  ArrowLeft,
  ArrowUp,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ExternalLink,
  Pencil,
  Table as TableIcon,
  ListTodo,
  Trash2,
  ArrowDown,
  ArrowRight,
  Indent,
  Outdent,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import imageService from "@/shared/utils/imageService";
import { useToolbarState } from "../hooks/useToolbarState";
import LinkEditorPopover from "./LinkEditorPopover";
import TableGridPicker from "./TableGridPicker";
import ColorPickerDropdown from "./ColorPickerDropdown";
import { stopUndoCapturing } from "./undoCapture";

const DEFAULT_FONT_FAMILY = "Arial";
const FONT_FAMILIES = [DEFAULT_FONT_FAMILY, "Times New Roman", "Courier New", "Inter", "Georgia"];
const DEFAULT_FONT_SIZE = "16px";
const FONT_SIZES = ["12px", "14px", DEFAULT_FONT_SIZE, "18px", "20px", "24px", "32px"];
const BLOCK_TYPES = [
  { value: "p", label: "Normal text", fontSize: "0.75rem", fontWeight: 400 },
  { value: "h1", label: "Heading 1", fontSize: "1rem", fontWeight: 700 },
  { value: "h2", label: "Heading 2", fontSize: "0.875rem", fontWeight: 700 },
  { value: "h3", label: "Heading 3", fontSize: "0.8125rem", fontWeight: 700 },
] as const;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type Props = {
  editor: Editor | null;
  onToggleFindReplace?: () => void;
  workspaceId?: string;
  pageId?: string;
  pageTitle?: string;
};

type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title: string;
  useUndoBoundary?: boolean;
};

const getTextStyleAttributes = (editor: Editor | null) => {
  const attributes = editor?.getAttributes("textStyle") ?? {};
  let fontSize = typeof attributes.fontSize === "string" ? attributes.fontSize : "";
  if (fontSize && !/[a-zA-Z%]/.test(fontSize)) {
    fontSize = `${fontSize}px`;
  }
  return {
    fontFamily: typeof attributes.fontFamily === "string" ? attributes.fontFamily : "",
    fontSize,
  };
};

const serializeStoredMarks = (editor: Editor) => {
  const { storedMarks } = editor.state;

  if (storedMarks === null) {
    return "__inherit__";
  }

  if (storedMarks.length === 0) {
    return "__empty__";
  }

  return storedMarks
    .map((mark) => `${mark.type.name}:${JSON.stringify(mark.attrs)}`)
    .join("|");
};

const getNonWhitespaceSegments = (editor: Editor, from: number, to: number, markName: "underline" | "strike") => {
  const segments: Array<{ from: number; to: number; marked: boolean }> = [];

  editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText || !node.text) {
      return;
    }

    const start = Math.max(from, pos);
    const end = Math.min(to, pos + node.nodeSize);

    if (start >= end) {
      return;
    }

    const textStart = start - pos;
    const textEnd = end - pos;
    const textSlice = node.text.slice(textStart, textEnd);
    const marked = node.marks.some((mark) => mark.type.name === markName);
    const nonWhitespaceRegex = /\S+/g;
    let match: RegExpExecArray | null;

    while ((match = nonWhitespaceRegex.exec(textSlice)) !== null) {
      const segmentFrom = start + match.index;
      const segmentTo = segmentFrom + match[0].length;
      segments.push({
        from: segmentFrom,
        to: segmentTo,
        marked,
      });
    }
  });

  return segments;
};

const toggleInlineMarkSkippingSpaces = (editor: Editor, markName: "underline" | "strike") => {
  editor.commands.focus();

  const { selection, schema, tr } = editor.state;
  const targetMark = schema.marks[markName];

  if (!targetMark) {
    return false;
  }

  if (selection.empty) {
    return markName === "underline"
      ? editor.chain().focus().toggleUnderline().run()
      : editor.chain().focus().toggleStrike().run();
  }

  const segments = getNonWhitespaceSegments(editor, selection.from, selection.to, markName);

  if (segments.length === 0) {
    return true;
  }

  const shouldUnset = segments.every((segment) => segment.marked);

  if (shouldUnset) {
    editor.view.dispatch(tr.removeMark(selection.from, selection.to, targetMark).scrollIntoView());
    return true;
  }

  let nextTr = tr.removeMark(selection.from, selection.to, targetMark);

  for (const segment of segments) {
    nextTr = nextTr.addMark(segment.from, segment.to, targetMark.create());
  }

  editor.view.dispatch(nextTr.scrollIntoView());
  return true;
};

const toImageUrl = (url: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
};

export default function EditorToolbar({
  editor,
  onToggleFindReplace,
  workspaceId,
  pageId,
  pageTitle,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const linkButtonRef = useRef<HTMLButtonElement | null>(null);
  const tableButtonRef = useRef<HTMLButtonElement | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) return null;

      return {
        from: currentEditor.state.selection.from,
        to: currentEditor.state.selection.to,
        storedMarks: serializeStoredMarks(currentEditor),
        docSize: currentEditor.state.doc.content.size,
      };
    },
  });
  const activeTextStyle = getTextStyleAttributes(editor);
  const toolbarState = useToolbarState(editor);
  const closeLinkPopover = useCallback(() => setLinkPopoverOpen(false), []);
  const closeTablePicker = useCallback(() => setTablePickerOpen(false), []);
  const runWithUndoBoundary = useCallback(
    (action: () => void) => {
      stopUndoCapturing(editor);
      action();
      stopUndoCapturing(editor);
    },
    [editor],
  );

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
    useUndoBoundary = true,
  }: ToolbarButtonProps) => (
    <button
      onMouseDown={(event) => {
        event.preventDefault();
        if (!disabled) {
          if (useUndoBoundary) {
            runWithUndoBoundary(onClick);
          } else {
            onClick();
          }
        }
      }}
      disabled={disabled}
      title={title}
      aria-pressed={Boolean(isActive)}
      className={`p-2 rounded-[6px] transition-all flex items-center justify-center ${
        isActive
          ? "bg-[#DBEAFE] text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.10)] dark:bg-[rgba(59,130,246,0.22)] dark:text-[#BFDBFE] dark:shadow-[inset_0_0_0_1px_rgba(147,197,253,0.18)] font-bold"
          : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
      } ${disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}`}
      type="button"
    >
      {children}
    </button>
  );

  const openLinkPopover = () => {
    setTablePickerOpen(false);
    setLinkPopoverOpen(true);
  };

  const openActiveLink = () => {
    const href = editor.getAttributes("link").href;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  const uploadLocalImage = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Max image size not over 5MB");
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid image format");
      return;
    }
    try {
      const result = await imageService.uploadImage(
        file,
        true,
        workspaceId,
        "page",
        pageId,
        pageTitle
      );
      const imageUrl = toImageUrl(result.imageUrl || result.url || "");
      if (!imageUrl) { toast.error("Failed to get image URL after upload"); return; }
      runWithUndoBoundary(() => {
        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      });
      toast.success("Image inserted successfully");
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const insertImage = () => imageInputRef.current?.click();
  const toggleTablePicker = () => setTablePickerOpen((c) => !c);
  const insertTable = (rows: number, cols: number) => {
    runWithUndoBoundary(() => {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    });
    closeTablePicker();
  };

  const inTable = toolbarState.table;
  const selectedFontFamily = activeTextStyle.fontFamily || DEFAULT_FONT_FAMILY;
  const selectedFontSize = activeTextStyle.fontSize || DEFAULT_FONT_SIZE;
  const selectedBlockType = toolbarState.blockType;

  const selectCls = "h-8 max-w-[160px] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.10] bg-white dark:bg-[#252525] px-2 text-[0.6875rem] font-medium text-[#111111] dark:text-[#E8E8E7] outline-none transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2A2A2A] focus:border-[#2563EB] dark:focus:border-[#3B82F6] dark:[color-scheme:dark]";
  const optionCls = "bg-white text-[#111111] dark:bg-[#252525] dark:text-[#E8E8E7]";

  return (
    <>
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: currentEditor }) =>
            currentEditor.isActive("link")
          }
          options={{ placement: "top", offset: 8 }}
        >
          <div
            className="flex items-center gap-1 rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-1"
            style={{
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <button
              type="button"
              onClick={openActiveLink}
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1.5 text-[0.6875rem] font-semibold text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
            <button
              type="button"
              onClick={openLinkPopover}
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1.5 text-[0.6875rem] font-semibold text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                runWithUndoBoundary(() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                });
              }}
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1.5 text-[0.6875rem] font-semibold text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] transition-colors"
            >
              <Unlink className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </BubbleMenu>
      )}

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 px-4 py-2 lg:px-6 bg-white dark:bg-[#202020] border-b border-[#EAEAEA] dark:border-white/[0.06] overflow-visible flex-shrink-0">
        <input
          ref={imageInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await uploadLocalImage(file);
            }
            e.target.value = "";
          }}
        />

        <select
          className={selectCls}
          value={selectedFontFamily}
          onChange={(e) => {
            const value = e.target.value;
            runWithUndoBoundary(() => {
              editor.chain().focus().setFontFamily(value).run();
            });
          }}
        >
          <option value="">Font</option>
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} className={optionCls} style={{ fontFamily: font }}>{font}</option>
          ))}
        </select>

        <select
          className={selectCls}
          value={selectedBlockType}
          onChange={(e) => {
            const val = e.target.value;
            runWithUndoBoundary(() => {
              if (val === "p") {
                editor.chain().focus().setParagraph().run();
              } else if (val === "h1") {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              } else if (val === "h2") {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (val === "h3") {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              }
            });
          }}
        >
          {BLOCK_TYPES.map((blockType) => (
            <option
              key={blockType.value}
              value={blockType.value}
              className={optionCls}
              style={{
                fontSize: blockType.fontSize,
                fontWeight: blockType.fontWeight,
              }}
            >
              {blockType.label}
            </option>
          ))}
        </select>

        <select
          className={selectCls}
          value={selectedFontSize}
          onChange={(e) => {
            const value = e.target.value;
            runWithUndoBoundary(() => {
              editor.chain().focus().setFontSize(value).run();
            });
          }}
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size} className={optionCls}>{size.replace("px", "")}</option>
          ))}
        </select>

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={toolbarState.bold} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={toolbarState.italic} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleInlineMarkSkippingSpaces(editor, "underline")} isActive={toolbarState.underline} title="Underline">
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleInlineMarkSkippingSpaces(editor, "strike")} isActive={toolbarState.strike} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="h-4 w-px bg-[#EAEAEA] dark:bg-white/8" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={toolbarState.bulletList} title="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={toolbarState.orderedList} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={toolbarState.taskList} title="Checklist">
          <ListTodo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={toolbarState.blockquote} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().indent().run()} title="Increase indent">
          <Indent className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().outdent().run()} title="Decrease indent">
          <Outdent className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        <ColorPickerDropdown editor={editor} />

        <div className="h-4 w-px bg-[#EAEAEA] dark:bg-white/8" />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={toolbarState.textAlign === "left"} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={toolbarState.textAlign === "center"} title="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={toolbarState.textAlign === "right"} title="Align right">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={toolbarState.textAlign === "justify"} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <select
          className={selectCls}
          onChange={(e) => {
            const val = e.target.value;
            runWithUndoBoundary(() => {
              if (val === "default") {
                editor.chain().focus().unsetLineHeight().run();
              } else {
                editor.chain().focus().setLineHeight(val).run();
              }
            });
          }}
          defaultValue="default"
        >
          <option value="default" className={optionCls}>Line height</option>
          <option value="1" className={optionCls}>1.0</option>
          <option value="1.15" className={optionCls}>1.15</option>
          <option value="1.5" className={optionCls}>1.5</option>
          <option value="2" className={optionCls}>2.0</option>
        </select>

        <div className="h-4 w-px bg-[#EAEAEA] dark:bg-white/8" />

        <button
          ref={linkButtonRef}
          onMouseDown={(event) => {
            event.preventDefault();
            openLinkPopover();
          }}
          title="Set up or edit link"
          className={`p-2 rounded-[6px] transition-all flex items-center justify-center ${
            toolbarState.link || linkPopoverOpen
              ? "bg-[#DBEAFE] text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.10)] dark:bg-[rgba(59,130,246,0.22)] dark:text-[#BFDBFE] dark:shadow-[inset_0_0_0_1px_rgba(147,197,253,0.18)] font-bold"
              : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
          }`}
          type="button"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        {linkPopoverOpen && (
          <LinkEditorPopover
            editor={editor}
            anchorEl={linkButtonRef.current}
            onClose={closeLinkPopover}
          />
        )}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
          }
          title="Remove link"
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={insertImage} title="Insert image" useUndoBoundary={false}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={toolbarState.taskList} title="Checklist">
          <ListTodo className="h-4 w-4" />
        </ToolbarButton>

        <button
          ref={tableButtonRef}
          onMouseDown={(event) => {
            event.preventDefault();
            toggleTablePicker();
          }}
          title="Insert table"
          className={`
          p-2 rounded-lg transition-all flex items-center justify-center
          ${
            tablePickerOpen
              ? "bg-[#DBEAFE] text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.10)] dark:bg-[rgba(59,130,246,0.22)] dark:text-[#BFDBFE] dark:shadow-[inset_0_0_0_1px_rgba(147,197,253,0.18)] font-bold"
              : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
          }`}
          type="button"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        {tablePickerOpen && (
          <TableGridPicker
            anchorEl={tableButtonRef.current}
            onClose={closeTablePicker}
            onSelect={insertTable}
          />
        )}

        {inTable && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add row above"
            >
              <ArrowUp className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add row below"
            >
              <ArrowDown className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add column to the left"
            >
              <ArrowLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add column to the right"
            >
              <ArrowRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete row"
            >
              <Trash2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete column"
            >
              <Trash2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete table"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </ToolbarButton>
          </>
        )}

        <div className="flex items-center gap-1">
          {onToggleFindReplace && (
            <ToolbarButton onClick={onToggleFindReplace} title="Find & Replace" useUndoBoundary={false}>
              <Search className="h-4 w-4" />
            </ToolbarButton>
          )}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo" useUndoBoundary={false}>
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo" useUndoBoundary={false}>
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>
    </>
  );
}
