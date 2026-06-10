// Component dùng để dừng việc ghi lại các thao tác vào undo stack của Yjs, 
// giúp tránh việc undo bị lộn xộn khi có nhiều thao tác liên tiếp được thực hiện.
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
