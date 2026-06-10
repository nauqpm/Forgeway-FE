import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
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
import { ResizableImage } from "./ResizableImage";
import type { Doc as YDoc } from "yjs";

const lowlight = createLowlight(common);

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
  TableHeader,
  TableCell,
  ResizableImage.configure({
    inline: false,
    allowBase64: false,
  }),
];

/**
 * Get editor extensions for Edit (collaborative) mode.
 * Uses Yjs Collaboration extension which replaces the built-in History extension.
 */
export const getCollaborativeEditorExtensions = (
  placeholder: string,
  ydoc: YDoc,
) => [
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
  TableHeader,
  TableCell,
  ResizableImage.configure({
    inline: false,
    allowBase64: false,
  }),
];
