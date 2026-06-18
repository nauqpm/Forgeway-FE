// Hook managing toolbar state in the document editor,
// monitors active text format (bold, italic, underline, strike), block type, and alignment,
// and updates toolbar indicators when selection or text changes.
"use client";

import type { Editor } from "@tiptap/react";

type BlockType = "p" | "h1" | "h2" | "h3";
type TextAlign = "left" | "center" | "right" | "justify" | null;

export type ToolbarState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  bulletList: boolean;
  orderedList: boolean;
  taskList: boolean;
  blockquote: boolean;
  link: boolean;
  table: boolean;
  blockType: BlockType;
  textAlign: TextAlign;
};

const DEFAULT_TOOLBAR_STATE: ToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  bulletList: false,
  orderedList: false,
  taskList: false,
  blockquote: false,
  link: false,
  table: false,
  blockType: "p",
  textAlign: null,
};

const hasStoredMark = (editor: Editor, markName: string) => {
  const storedMarks = editor.state.storedMarks;
  return storedMarks?.some((mark) => mark.type.name === markName) ?? false;
};

const isInlineMarkActive = (editor: Editor, markName: string) => {
  const { selection, storedMarks } = editor.state;

  // When the selection is collapsed, an explicit storedMarks value means
  // ProseMirror has already decided what the next typed character should use.
  // We prefer that over contextual isActive() so the toolbar turns off
  // immediately after toggling a mark off at the caret.
  if (selection.empty && storedMarks !== null) {
    return hasStoredMark(editor, markName);
  }

  return editor.isActive(markName);
};

const getBlockType = (editor: Editor): BlockType => {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  return "p";
};

const getTextAlign = (editor: Editor): TextAlign => {
  if (editor.isActive({ textAlign: "center" })) return "center";
  if (editor.isActive({ textAlign: "right" })) return "right";
  if (editor.isActive({ textAlign: "justify" })) return "justify";
  if (editor.isActive({ textAlign: "left" })) return "left";
  return null;
};

const readToolbarState = (editor: Editor | null): ToolbarState => {
  if (!editor) return DEFAULT_TOOLBAR_STATE;

  return {
    bold: isInlineMarkActive(editor, "bold"),
    italic: isInlineMarkActive(editor, "italic"),
    underline: isInlineMarkActive(editor, "underline"),
    strike: isInlineMarkActive(editor, "strike"),
    bulletList: editor.isActive("bulletList"),
    orderedList: editor.isActive("orderedList"),
    taskList: editor.isActive("taskList"),
    blockquote: editor.isActive("blockquote"),
    link: editor.isActive("link"),
    table: editor.isActive("table"),
    blockType: getBlockType(editor),
    textAlign: getTextAlign(editor),
  };
};

export function useToolbarState(editor: Editor | null) {
  return readToolbarState(editor);
}
