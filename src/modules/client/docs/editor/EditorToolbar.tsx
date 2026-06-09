"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import imageService from "@/common/services/imageService";
import LinkEditorPopover from "./LinkEditorPopover";
import TableGridPicker from "./TableGridPicker";

const DEFAULT_FONT_FAMILY = "Arial";
const FONT_FAMILIES = [
  DEFAULT_FONT_FAMILY,
  "Times New Roman",
  "Courier New",
  "Inter",
  "Georgia",
];
const DEFAULT_FONT_SIZE = "16";
const FONT_SIZES = ["12", "14", DEFAULT_FONT_SIZE, "18", "20", "24", "32"];
const COLORS = [
  "#111827",
  "#EF4444",
  "#2563EB",
  "#059669",
  "#D97706",
  "#7C3AED",
];
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type Props = {
  editor: Editor | null;
};

type ToolbarButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title: string;
};

const getTextStyleAttributes = (editor: Editor | null) => {
  const attributes = editor?.getAttributes("textStyle") ?? {};
  return {
    fontFamily:
      typeof attributes.fontFamily === "string" ? attributes.fontFamily : "",
    fontSize:
      typeof attributes.fontSize === "string" ? attributes.fontSize : "",
  };
};

const areTextStyleAttributesEqual = (
  first: ReturnType<typeof getTextStyleAttributes>,
  second: ReturnType<typeof getTextStyleAttributes>,
) =>
  first.fontFamily === second.fontFamily && first.fontSize === second.fontSize;

const toImageUrl = (url: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}${url}`;
};

export default function EditorToolbar({ editor }: Props) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const linkButtonRef = useRef<HTMLButtonElement | null>(null);
  const tableButtonRef = useRef<HTMLButtonElement | null>(null);
  const [activeTextStyle, setActiveTextStyle] = useState(() =>
    getTextStyleAttributes(editor),
  );
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const closeLinkPopover = useCallback(() => setLinkPopoverOpen(false), []);
  const closeTablePicker = useCallback(() => setTablePickerOpen(false), []);

  useEffect(() => {
    if (!editor) {
      setActiveTextStyle(getTextStyleAttributes(null));
      return;
    }
    const updateActiveTextStyle = () => {
      const nextTextStyle = getTextStyleAttributes(editor);
      setActiveTextStyle((currentTextStyle) =>
        areTextStyleAttributesEqual(currentTextStyle, nextTextStyle)
          ? currentTextStyle
          : nextTextStyle,
      );
    };
    updateActiveTextStyle();
    editor.on("selectionUpdate", updateActiveTextStyle);
    editor.on("transaction", updateActiveTextStyle);
    return () => {
      editor.off("selectionUpdate", updateActiveTextStyle);
      editor.off("transaction", updateActiveTextStyle);
    };
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
  }: ToolbarButtonProps) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-[6px] transition-all flex items-center justify-center ${
        isActive
          ? "bg-[#F7F6F3] dark:bg-[#252525] text-[#2563EB] dark:text-[#3B82F6] font-bold"
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
      const result = await imageService.uploadImage(file, true);
      const imageUrl = toImageUrl(result.imageUrl || result.url || "");
      if (!imageUrl) {
        toast.error("Failed to get image URL after upload");
        return;
      }
      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      toast.success("Image inserted successfully");
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const insertImage = () => imageInputRef.current?.click();
  const toggleTablePicker = () => setTablePickerOpen((c) => !c);
  const insertTable = (rows: number, cols: number) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    closeTablePicker();
  };

  const inTable = editor.isActive("table");
  const selectedFontFamily = activeTextStyle.fontFamily || DEFAULT_FONT_FAMILY;
  const selectedFontSize = activeTextStyle.fontSize || DEFAULT_FONT_SIZE;

  const selectCls = "h-8 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] px-2 text-[0.6875rem] text-[#111111] dark:text-[#E8E8E7] outline-none";

  return (
    <>
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e }) => e.isActive("link")}
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
              onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
              className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1.5 text-[0.6875rem] font-semibold text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] transition-colors"
            >
              <Unlink className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </BubbleMenu>
      )}

      <div className="flex items-center gap-1 px-6 py-2 bg-white dark:bg-[#202020] border-b border-[#EAEAEA] dark:border-white/[0.06] overflow-x-auto no-scrollbar flex-shrink-0">
        <input
          ref={imageInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await uploadLocalImage(file);
            e.target.value = "";
          }}
        />

        <select
          className={selectCls}
          style={{ fontFamily: selectedFontFamily }}
          value={selectedFontFamily}
          onChange={(e) => {
            const value = e.target.value;
            setActiveTextStyle((c) => ({ ...c, fontFamily: value }));
            editor.chain().focus().setFontFamily(value).run();
          }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>

        <select
          className={selectCls}
          value={selectedFontSize}
          onChange={(e) => {
            const value = e.target.value;
            setActiveTextStyle((c) => ({ ...c, fontSize: value }));
            editor.chain().focus().setFontSize(value).run();
          }}
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={`Color ${color}`}
            onClick={() => editor.chain().focus().setColor(color).run()}
            className="h-5 w-5 rounded-[3px] border border-[#EAEAEA] dark:border-white/[0.06] transition-opacity hover:opacity-80"
            style={{ backgroundColor: color }}
          />
        ))}

        <ToolbarButton onClick={() => editor.chain().focus().unsetColor().run()} title="Reset text color">
          <span className="text-[0.6875rem] font-bold">A</span>
        </ToolbarButton>

        <div className="h-4 w-px bg-[#EAEAEA] dark:bg-white/8" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <div className="h-4 w-px bg-[#EAEAEA] dark:bg-white/8" />

        <button
          ref={linkButtonRef}
          onClick={openLinkPopover}
          title="Set up or edit link"
          className={`p-2 rounded-[6px] transition-all flex items-center justify-center ${
            editor.isActive("link") || linkPopoverOpen
              ? "bg-[#F7F6F3] dark:bg-[#252525] text-[#2563EB] dark:text-[#3B82F6] font-bold"
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

        <ToolbarButton onClick={insertImage} title="Insert image">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive("taskList")}
          title="Checklist"
        >
          <ListTodo className="h-4 w-4" />
        </ToolbarButton>

        <button
          ref={tableButtonRef}
          onClick={toggleTablePicker}
          title="Insert table"
          className={`p-2 rounded-[6px] transition-all flex items-center justify-center ${
            tablePickerOpen
              ? "bg-[#F7F6F3] dark:bg-[#252525] text-[#2563EB] dark:text-[#3B82F6] font-bold"
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
              <Trash2 className="h-4 w-4 text-[#9F2F2D]" />
            </ToolbarButton>
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>
    </>
  );
}
