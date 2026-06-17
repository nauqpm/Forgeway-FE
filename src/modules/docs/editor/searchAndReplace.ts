// Defines SearchAndReplace extension for the document editor,
// enabling search and replace functionality.
import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchAndReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setReplaceTerm: (term: string) => ReturnType;
      replace: () => ReturnType;
      replaceAll: () => ReturnType;
    };
  }
}

export interface SearchAndReplaceOptions {
  searchResultClass: string;
  caseSensitive: boolean;
}

export const SearchAndReplace = Extension.create<SearchAndReplaceOptions>({
  name: "searchAndReplace",

  addOptions() {
    return {
      searchResultClass: "search-result bg-yellow-200 text-black dark:bg-yellow-800/80 dark:text-white px-0.5 rounded-sm",
      caseSensitive: false,
    };
  },

  addStorage() {
    return {
      searchTerm: "",
      replaceTerm: "",
      results: [] as { from: number; to: number }[],
    };
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ view }) => {
          this.storage.searchTerm = term;
          view.dispatch(view.state.tr.setMeta("searchAndReplace", true));
          return true;
        },
      setReplaceTerm:
        (term: string) =>
        () => {
          this.storage.replaceTerm = term;
          return true;
        },
      replace:
        () =>
        ({ state, dispatch }) => {
          const { replaceTerm, results } = this.storage;
          if (results.length === 0) return false;

          const current = results[0];
          if (current && dispatch) {
            const tr = state.tr.insertText(replaceTerm || "", current.from, current.to);
            dispatch(tr);
            return true;
          }
          return false;
        },
      replaceAll:
        () =>
        ({ state, dispatch }) => {
          const { replaceTerm, results } = this.storage;
          if (results.length === 0) return false;

          if (dispatch) {
            let tr = state.tr;
            // Sort in reverse order to avoid shifting positions
            const sortedResults = [...results].sort((a, b) => b.from - a.from);
            sortedResults.forEach((match) => {
              tr = tr.insertText(replaceTerm || "", match.from, match.to);
            });
            dispatch(tr);
            return true;
          }
          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey("searchAndReplace"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr) {
            const searchTerm = storage.searchTerm;
            if (!searchTerm) {
              storage.results = [];
              return DecorationSet.empty;
            }

            const { doc } = tr;
            const decorations: Decoration[] = [];
            const results: { from: number; to: number }[] = [];
            const regex = new RegExp(
              searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
              options.caseSensitive ? "g" : "gi"
            );

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                let match;
                while ((match = regex.exec(node.text)) !== null) {
                  const from = pos + match.index;
                  const to = from + match[0].length;
                  decorations.push(
                    Decoration.inline(from, to, {
                      class: options.searchResultClass,
                    })
                  );
                  results.push({ from, to });
                }
              }
            });

            storage.results = results;
            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
