// Component dùng để dừng việc ghi lại các thao tác vào undo stack của Yjs,
// giúp tránh việc undo bị lộn xộn khi có nhiều thao tác liên tiếp được thực hiện.
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { yUndoPluginKey } from "@tiptap/y-tiptap";

const TEXT_BOUNDARY_REGEX = /^[\s.,;:!?)]$/;

const stopCapturingFromView = (view: EditorView) => {
  const undoManager = yUndoPluginKey.getState(view.state)?.undoManager;
  undoManager?.stopCapturing();
};

const scheduleStopCapturing = (view: EditorView) => {
  queueMicrotask(() => stopCapturingFromView(view));
};

export const UndoCaptureBoundary = Extension.create({
  name: "undoCaptureBoundary",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleTextInput(view, _from, _to, text) {
            if (TEXT_BOUNDARY_REGEX.test(text)) {
              scheduleStopCapturing(view);
            }

            return false;
          },
          handleKeyDown(view, event) {
            if (event.key === "Enter") {
              scheduleStopCapturing(view);
            }

            return false;
          },
        },
      }),
    ];
  },
});
