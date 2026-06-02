"use client";

import { ReactNode, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
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
  Table as TableIcon,
  Rows2,
  Columns2,
  Merge,
  Split,
  ListTodo,
} from "lucide-react";
import { toast } from "react-hot-toast";
import imageService from "@/common/services/imageService";

const FONT_FAMILIES = ["Arial", "Times New Roman", "Courier New", "Inter", "Georgia"];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "32px"];
const COLORS = ["#111827", "#EF4444", "#2563EB", "#059669", "#D97706", "#7C3AED"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
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

const normalizeUrl = (raw: string) => {
  const input = raw.trim();
  if (!input) return "";
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return "";
  }
};

const toImageUrl = (url: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}${url}`;
};

export default function EditorToolbar({ editor }: Props) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all flex items-center justify-center
        ${
          isActive
            ? "bg-gray-100 dark:bg-gray-900 text-[#0052CC] dark:text-blue-400 font-bold"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-700 dark:hover:text-gray-200"
        }
        ${disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
      `}
      type="button"
    >
      {children}
    </button>
  );

  const setLink = () => {
    const current = editor.getAttributes("link").href || "";
    const raw = window.prompt("Nhập URL liên kết", current);
    if (raw === null) return;

    const url = normalizeUrl(raw);
    if (!url) {
      toast.error("URL không hợp lệ");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const uploadLocalImage = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Kích thước ảnh quá 5MB");
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Định dạng ảnh không hợp lệ");
      return;
    }

    try {
      const result = await imageService.uploadImage(file, true);
      const imageUrl = toImageUrl(result.imageUrl || result.url || "");
      if (!imageUrl) {
        toast.error("Không lấy được URL ảnh sau khi upload");
        return;
      }
      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      toast.success("Đã chèn ảnh");
    } catch {
      toast.error("Upload ảnh thất bại");
    }
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  const insertTable = () => {
    const rows = Number(window.prompt("Số dòng", "3"));
    const cols = Number(window.prompt("Số cột", "3"));
    if (!rows || !cols || rows < 1 || cols < 1) {
      toast.error("Số dòng/cột không hợp lệ");
      return;
    }
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  const inTable = editor.isActive("table");

  return (
    <div className="flex items-center gap-1 px-6 py-2 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar flex-shrink-0">
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
        className="h-8 rounded border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
        value={editor.getAttributes("textStyle").fontFamily || ""}
        onChange={(e) => {
          const value = e.target.value;
          if (!value) {
            editor.chain().focus().unsetFontFamily().run();
            return;
          }
          editor.chain().focus().setFontFamily(value).run();
        }}
      >
        <option value="">Font</option>
        {FONT_FAMILIES.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>

      <select
        className="h-8 rounded border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
        value={editor.getAttributes("textStyle").fontSize || ""}
        onChange={(e) => {
          const value = e.target.value;
          if (!value) {
            editor.chain().focus().unsetFontSize().run();
            return;
          }
          editor.chain().focus().setFontSize(value).run();
        }}
      >
        <option value="">Size</option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold">
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic">
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline">
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          title={`Màu ${color}`}
          onClick={() => editor.chain().focus().setColor(color).run()}
          className="h-5 w-5 rounded border border-gray-200"
          style={{ backgroundColor: color }}
        />
      ))}

      <ToolbarButton onClick={() => editor.chain().focus().unsetColor().run()} title="Reset text color">
        <span className="text-xs">A</span>
      </ToolbarButton>

      <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Align left">
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Align center">
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Align right">
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} title="Justify">
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />

      <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} title="Thiết lập hoặc chỉnh sửa liên kết">
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Hủy liên kết">
        <Unlink className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={insertImage} title="Chèn hình ảnh">
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive("taskList")} title="Checklist">
        <ListTodo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton onClick={insertTable} title="Chèn bảng">
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      {inTable && (
        <>
          <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Thêm hàng">
            <Rows2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Thêm cột">
            <Columns2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} title="Gộp ô">
            <Merge className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().splitCell().run()} title="Tách ô">
            <Split className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}

      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}

