// Đây là file định nghĩa các extension được sử dụng trong editor của tài liệu.
// Các extension này bao gồm các tính năng cơ bản như định dạng văn bản, tạo bảng, danh sách công việc, 
// cũng như các tính năng nâng cao hơn như cộng tác thời gian thực, đánh dấu comment, đề xuất chỉnh sửa, v.v.
// Việc tách riêng phần cấu hình extension giúp mã nguồn của editor trở nên gọn gàng và dễ bảo trì hơn.
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {Table} from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { common, createLowlight } from "lowlight";
import { FontSize } from "./fontSize";
import { LineHeight } from "./lineHeight";
import { Indent } from "./indent";
import { SearchAndReplace } from "./searchAndReplace";
import { ResizableImage } from "./ResizableImage";
import { CommentMark } from "./commentMark";
import { SuggestInsert, SuggestDelete, SuggestionExtension } from "./suggestionExtension";
import { UndoCaptureBoundary } from "./undoCaptureBoundary";
import type { Doc as YDoc } from "yjs";

const lowlight = createLowlight(common);

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});

/**
 * Get editor extensions for Read mode (no collaboration, with undo history).
 */
export const getEditorExtensions = (placeholder: string) => [
  StarterKit.configure({
    codeBlock: false,
    heading: {
      levels: [1, 2, 3],
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      rel: "noopener noreferrer",
    },
  }),
  Placeholder.configure({
    placeholder,
  }),
  TextStyle,
  FontFamily,
  FontSize,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Underline,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  CustomTableHeader,
  CustomTableCell,
  ResizableImage.configure({
    inline: false,
    allowBase64: false,
  }),
  LineHeight,
  Indent,
  SearchAndReplace,
  CommentMark,
  SuggestInsert,
  SuggestDelete,
  SuggestionExtension,
];

/**
 * Get editor extensions for Edit (collaborative) mode.
 * Uses Yjs Collaboration extension which replaces the built-in History extension.
 */
export const getCollaborativeEditorExtensions = (
  placeholder: string,
  ydoc: YDoc,
  _awareness?: any,
) => {
  const extensions = [
    StarterKit.configure({
      codeBlock: false,
      heading: {
        levels: [1, 2, 3],
      },
      // Disable built-in undo/redo — Collaboration provides its own
      undoRedo: false,
    }),
    Collaboration.configure({
      document: ydoc,
      yUndoOptions: {
        captureTimeout: 300,
      },
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer",
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
    TextStyle,
    FontFamily,
    FontSize,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Underline,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    CustomTableHeader,
    CustomTableCell,
    ResizableImage.configure({
      inline: false,
      allowBase64: false,
    }),
    LineHeight,
    Indent,
    SearchAndReplace,
    CommentMark,
    SuggestInsert,
    SuggestDelete,
    SuggestionExtension,
    UndoCaptureBoundary,
  ];

  return extensions;
};
