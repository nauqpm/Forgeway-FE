// Component to pause recording history to Yjs undo stack,
// preventing history clutter during batch updates.
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
