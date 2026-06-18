// Defines Suggestion extension for the document editor,
// allowing users to suggest text insertions/deletions and manage suggestions.
import { Extension, Mark } from "@tiptap/core";
import { Plugin, PluginKey, EditorState, Transaction } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    suggestion: {
      setSuggestionMode: (active: boolean) => ReturnType;
      setSuggestionUser: (user: { id: string; name: string }) => ReturnType;
      acceptSuggestion: (id: string) => ReturnType;
      rejectSuggestion: (id: string) => ReturnType;
    };
  }
}

export interface SuggestionStorage {
  active: boolean;
  user: { id: string; name: string };
}

// Generate lightweight unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// 1. SuggestInsert Mark
export const SuggestInsert = Mark.create({
  name: "suggestInsert",

  addAttributes() {
    return {
      id: { default: null },
      userId: { default: null },
      userName: { default: null },
      createdAt: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-suggest-insert]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...HTMLAttributes,
        "data-suggest-insert": "",
        class: "suggest-insert border-b-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 cursor-pointer transition-all duration-150",
      },
      0,
    ];
  },
});

// 2. SuggestDelete Mark
export const SuggestDelete = Mark.create({
  name: "suggestDelete",

  addAttributes() {
    return {
      id: { default: null },
      userId: { default: null },
      userName: { default: null },
      createdAt: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-suggest-delete]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...HTMLAttributes,
        "data-suggest-delete": "",
        class: "suggest-delete line-through text-rose-500 bg-rose-50/30 dark:bg-rose-950/20 select-none cursor-pointer transition-all duration-150",
      },
      0,
    ];
  },
});

// 3. Suggestion Controller Extension
export const SuggestionExtension = Extension.create({
  name: "suggestion",

  addStorage() {
    return {
      active: false,
      user: { id: "", name: "" },
    } as SuggestionStorage;
  },

  addCommands() {
    const storage = this.storage;

    return {
      setSuggestionMode:
        (active: boolean) =>
        () => {
          storage.active = active;
          return true;
        },
      setSuggestionUser:
        (user: { id: string; name: string }) =>
        () => {
          storage.user = user;
          return true;
        },
      acceptSuggestion:
        (id: string) =>
        ({ tr, state, dispatch }: { tr: Transaction; state: EditorState; dispatch?: (tr: Transaction) => void }) => {
          const { suggestInsert, suggestDelete } = state.schema.marks;
          if (!suggestInsert || !suggestDelete) return false;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actions: Array<{ type: "removeMark" | "delete"; from: number; to: number; markType?: any }> = [];

          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const nodeFrom = pos;
            const nodeTo = pos + node.nodeSize;

            const insertMark = node.marks.find((m) => m.type === suggestInsert && m.attrs.id === id);
            const deleteMark = node.marks.find((m) => m.type === suggestDelete && m.attrs.id === id);

            if (insertMark) {
              actions.push({ type: "removeMark", from: nodeFrom, to: nodeTo, markType: suggestInsert });
            } else if (deleteMark) {
              actions.push({ type: "delete", from: nodeFrom, to: nodeTo });
            }
          });

          if (actions.length === 0) return false;

          actions.sort((a, b) => b.from - a.from);
          actions.forEach((action) => {
            if (action.type === "removeMark") {
              tr.removeMark(action.from, action.to, action.markType);
            } else if (action.type === "delete") {
              tr.delete(action.from, action.to);
            }
          });

          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
      rejectSuggestion:
        (id: string) =>
        ({ tr, state, dispatch }: { tr: Transaction; state: EditorState; dispatch?: (tr: Transaction) => void }) => {
          const { suggestInsert, suggestDelete } = state.schema.marks;
          if (!suggestInsert || !suggestDelete) return false;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actions: Array<{ type: "removeMark" | "delete"; from: number; to: number; markType?: any }> = [];

          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const nodeFrom = pos;
            const nodeTo = pos + node.nodeSize;

            const insertMark = node.marks.find((m) => m.type === suggestInsert && m.attrs.id === id);
            const deleteMark = node.marks.find((m) => m.type === suggestDelete && m.attrs.id === id);

            if (insertMark) {
              actions.push({ type: "delete", from: nodeFrom, to: nodeTo });
            } else if (deleteMark) {
              actions.push({ type: "removeMark", from: nodeFrom, to: nodeTo, markType: suggestDelete });
            }
          });

          if (actions.length === 0) return false;

          actions.sort((a, b) => b.from - a.from);
          actions.forEach((action) => {
            if (action.type === "removeMark") {
              tr.removeMark(action.from, action.to, action.markType);
            } else if (action.type === "delete") {
              tr.delete(action.from, action.to);
            }
          });

          if (dispatch) {
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    const pluginKey = new PluginKey("suggestionModePlugin");

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return {
              active: storage.active,
              user: storage.user,
            };
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          apply(_tr, _value, _oldState, _newState) {
            // Sync plugin state with extension storage
            return {
              active: storage.active,
              user: storage.user,
            };
          },
        },
        props: {
          handleKeyDown(view, event) {
            if (!storage.active || !storage.user.id) return false;

            if (event.key === "Backspace" || event.key === "Delete") {
              const isBackspace = event.key === "Backspace";
              const { state, dispatch } = view;
              const { from, to, empty } = state.selection;
              const suggestInsertType = state.schema.marks.suggestInsert;
              const suggestDeleteType = state.schema.marks.suggestDelete;

              if (!suggestInsertType || !suggestDeleteType) return false;

              const tr = state.tr;

              if (empty) {
                const targetPos = isBackspace ? from - 1 : from;
                if (targetPos < 0 || targetPos >= state.doc.content.size) return false;

                const node = state.doc.nodeAt(targetPos);
                if (!node || !node.isText) return false;

                const hasInsert = node.marks.find((m) => m.type === suggestInsertType);
                const hasDelete = node.marks.find((m) => m.type === suggestDeleteType);

                if (hasDelete) {
                  // Already marked as delete, let's absorb the key press
                  return true;
                }

                if (hasInsert && hasInsert.attrs.userId === storage.user.id) {
                  // If it's user's own insert, delete it directly
                  tr.delete(targetPos, targetPos + 1);
                } else {
                  // Otherwise, mark it as suggest-delete
                  const mark = suggestDeleteType.create({
                    id: generateId(),
                    userId: storage.user.id,
                    userName: storage.user.name,
                    createdAt: new Date().toISOString(),
                  });
                  tr.addMark(targetPos, targetPos + 1, mark);
                }
                if (dispatch) dispatch(tr);
                return true;
              } else {
                // Range selection deletion
                const actions: Array<{ type: "delete" | "markDelete"; from: number; to: number }> = [];

                state.doc.nodesBetween(from, to, (node, pos) => {
                  if (!node.isText) return;
                  const nodeFrom = Math.max(from, pos);
                  const nodeTo = Math.min(to, pos + node.nodeSize);

                  const hasInsert = node.marks.find((m) => m.type === suggestInsertType);
                  const hasDelete = node.marks.find((m) => m.type === suggestDeleteType);

                  if (hasDelete) return;

                  if (hasInsert && hasInsert.attrs.userId === storage.user.id) {
                    actions.push({ type: "delete", from: nodeFrom, to: nodeTo });
                  } else {
                    actions.push({ type: "markDelete", from: nodeFrom, to: nodeTo });
                  }
                });

                if (actions.length === 0) return false;

                actions.sort((a, b) => b.from - a.from);
                actions.forEach((action) => {
                  if (action.type === "delete") {
                    tr.delete(action.from, action.to);
                  } else {
                    const mark = suggestDeleteType.create({
                      id: generateId(),
                      userId: storage.user.id,
                      userName: storage.user.name,
                      createdAt: new Date().toISOString(),
                    });
                    tr.addMark(action.from, action.to, mark);
                  }
                });

                if (dispatch) dispatch(tr);
                return true;
              }
            }
            return false;
          },
        },
        appendTransaction(transactions, oldState, newState) {
          if (!storage.active || !storage.user.id) return null;

          // Avoid processing our own appended transactions recursively
          const isAppended = transactions.some((tr) => tr.getMeta("suggestionModeAppended"));
          if (isAppended) return null;

          const suggestInsertType = newState.schema.marks.suggestInsert;
          if (!suggestInsertType) return null;

          const tr = newState.tr;
          let modified = false;

          transactions.forEach((transaction) => {
            if (!transaction.docChanged) return;
            if (transaction.getMeta("addToHistory") === false) return;

            transaction.steps.forEach((step) => {
              step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
                if (newEnd > newStart) {
                  // Text is inserted: mark it with suggestInsert
                  const mark = suggestInsertType.create({
                    id: generateId(),
                    userId: storage.user.id,
                    userName: storage.user.name,
                    createdAt: new Date().toISOString(),
                  });
                  tr.addMark(newStart, newEnd, mark);
                  modified = true;
                }
              });
            });
          });

          if (modified) {
            // Keep suggestion-mark bookkeeping out of undo/redo so history
            // reflects the user's editing intent rather than internal marks.
            tr.setMeta("addToHistory", false);
            tr.setMeta("suggestionModeAppended", true);
            return tr;
          }

          return null;
        },
      }),
    ];
  },
});
