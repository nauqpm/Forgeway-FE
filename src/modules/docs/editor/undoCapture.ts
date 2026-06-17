// Component to pause recording history to Yjs undo stack, 
// preventing history clutter during batch updates.
import type { Editor } from "@tiptap/react";
import { yUndoPluginKey } from "@tiptap/y-tiptap";

const getUndoManager = (editor: Editor | null) => {
  if (!editor) return null;

  const pluginState = yUndoPluginKey.getState(editor.state);
  return pluginState?.undoManager ?? null;
};

export const stopUndoCapturing = (editor: Editor | null) => {
  const undoManager = getUndoManager(editor);
  undoManager?.stopCapturing();
};
