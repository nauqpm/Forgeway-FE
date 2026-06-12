import { Extension } from "@tiptap/core";
import type { Mark } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";

const WHITESPACE_INPUT_REGEX = /^\s+$/;
const INLINE_MARKS_SKIP_WHITESPACE = ["underline", "strike"] as const;

const hasMarkActive = (
  markName: string,
  storedMarks: readonly Mark[] | null,
  marksAtCursor: readonly Mark[],
) => {
  if (storedMarks !== null) {
    return storedMarks.some((mark) => mark.type.name === markName);
  }

  return marksAtCursor.some((mark) => mark.type.name === markName);
};

export const UnderlineWhitespace = Extension.create({
  name: "underlineWhitespace",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            if (!WHITESPACE_INPUT_REGEX.test(text)) {
              return false;
            }

            const { state } = view;
            const marksAtCursor = state.selection.$from.marks();
            const activeMarksToSkip = INLINE_MARKS_SKIP_WHITESPACE
              .map((markName) => state.schema.marks[markName])
              .filter((markType): markType is NonNullable<typeof markType> => Boolean(markType))
              .filter((markType) => hasMarkActive(markType.name, state.storedMarks, marksAtCursor));

            if (activeMarksToSkip.length === 0) {
              return false;
            }

            const originalStoredMarks = state.storedMarks;
            const marksToRestore = originalStoredMarks ?? marksAtCursor;
            const tr = state.tr.insertText(text, from, to);

            for (const markType of activeMarksToSkip) {
              tr.removeMark(from, from + text.length, markType);
            }

            tr.setStoredMarks(marksToRestore);

            view.dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});
