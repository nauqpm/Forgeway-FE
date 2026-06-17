// Defines Indent extension for the document editor,
// allowing users to increase or decrease text indentation.
import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "taskItem"],
      minIndent: 0,
      maxIndent: 10,
      indentSize: 24, // margin size in pixels
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft || "0";
              const marginValue = parseInt(marginLeft, 10) || 0;
              return Math.round(marginValue / this.options.indentSize);
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent * this.options.indentSize}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, commands }) => {
          const { selection } = state;
          let hasUpdated = false;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          tr.doc.nodesBetween(selection.from, selection.to, (node, _pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const nextIndent = Math.min(this.options.maxIndent, currentIndent + 1);
              commands.updateAttributes(node.type.name, { indent: nextIndent });
              hasUpdated = true;
            }
          });
          return hasUpdated;
        },
      outdent:
        () =>
        ({ tr, state, commands }) => {
          const { selection } = state;
          let hasUpdated = false;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          tr.doc.nodesBetween(selection.from, selection.to, (node, _pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const nextIndent = Math.max(this.options.minIndent, currentIndent - 1);
              commands.updateAttributes(node.type.name, { indent: nextIndent });
              hasUpdated = true;
            }
          });
          return hasUpdated;
        },
    };
  },
});
