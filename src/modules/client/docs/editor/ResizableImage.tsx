// File defining the ResizableImage extension for the document editor,
// allowing users to insert images, resize, align, caption, and edit alt text.
"use client";

import Image from "@tiptap/extension-image";
import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { PointerEvent, useRef, useState } from "react";

type ImageAlign = "left" | "center" | "right";

const MIN_IMAGE_WIDTH = 120;

const getAlignClasses = (align: ImageAlign) => {
  if (align === "left") return "justify-start";
  if (align === "right") return "justify-end";
  return "justify-center";
};

const getImageStyle = (attrs: Record<string, unknown>) => {
  const align = attrs.align === "left" || attrs.align === "right" ? attrs.align : "center";
  const margin =
    align === "left"
      ? "0 auto 0 0"
      : align === "right"
        ? "0 0 0 auto"
        : "0 auto";
  const width = typeof attrs.width === "string" && attrs.width ? attrs.width : undefined;

  return [
    "display:block",
    "max-width:100%",
    "height:auto",
    `margin:${margin}`,
    width ? `width:${width}` : "",
  ]
    .filter(Boolean)
    .join(";");
};

function ResizableImageView({ node, selected, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const [isResizing, setIsResizing] = useState(false);
  const [showAltInput, setShowAltInput] = useState(false);
  const align = (node.attrs.align || "center") as ImageAlign;
  const isEditable = editor.isEditable;

  const setAlign = (nextAlign: ImageAlign) => {
    updateAttributes({ align: nextAlign });
  };

  const resetSize = () => {
    updateAttributes({ width: null });
  };

  const startResize = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isEditable) return;
    event.preventDefault();
    event.stopPropagation();

    const image = imgRef.current;
    if (!image) return;

    startXRef.current = event.clientX;
    startWidthRef.current = image.getBoundingClientRect().width;
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = moveEvent.clientX - startXRef.current;
      const editorWidth = wrapperRef.current?.getBoundingClientRect().width || editor.view.dom.getBoundingClientRect().width;
      const maxWidth = Math.max(MIN_IMAGE_WIDTH, Math.floor(editorWidth));
      const nextWidth = Math.min(
        maxWidth,
        Math.max(MIN_IMAGE_WIDTH, Math.round(startWidthRef.current + delta)),
      );

      updateAttributes({ width: `${nextWidth}px` });
    };

    const stopResize = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  return (
    <NodeViewWrapper
      as="div"
      ref={wrapperRef}
      className={`group my-6 flex flex-col items-center`}
      contentEditable={false}
      data-align={align}
    >
      <div className={`flex ${getAlignClasses(align)} w-full`}>
        <div
          className={`relative inline-block max-w-full rounded-sm ${
            selected || isResizing ? "ring-2 ring-[#2563EB] dark:ring-[#3B82F6] ring-offset-2 dark:ring-offset-[#1A1A1A]" : ""
          }`}
        >
          {isEditable && selected && (
            <div className="absolute -top-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] p-1" style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
              <button type="button" onClick={() => setAlign("left")} title="Align left" className="rounded-[4px] p-1.5 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5">
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setAlign("center")} title="Align center" className="rounded-[4px] p-1.5 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5">
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setAlign("right")} title="Align right" className="rounded-[4px] p-1.5 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5">
                <AlignRight className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={resetSize} title="Reset size" className="rounded-[4px] p-1.5 text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

              <button
                type="button"
                onClick={() => setShowAltInput(!showAltInput)}
                title="Alt Text (SEO)"
                className={`rounded-[4px] px-2 py-1 text-[10px] font-bold transition-colors ${
                  showAltInput ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40" : "text-[#787774] dark:text-[#9B9A97]"
                }`}
              >
                Alt
              </button>
              {showAltInput && (
                <input
                  type="text"
                  value={node.attrs.alt || ""}
                  onChange={(e) => updateAttributes({ alt: e.target.value })}
                  placeholder="Alt text..."
                  className="w-24 text-[10px] border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 bg-transparent text-gray-800 dark:text-gray-200"
                />
              )}

              <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

              <button type="button" onClick={deleteNode} title="Delete image" className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <img
            ref={imgRef}
            src={node.attrs.src}
            alt={node.attrs.alt || ""}
            title={node.attrs.title || ""}
            draggable={false}
            className={`block h-auto max-w-full rounded-sm transition-all ${
              node.attrs.uploading ? "blur-[2px]" : ""
            }`}
            style={{ width: node.attrs.width || undefined }}
          />

          {node.attrs.uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-950/50 backdrop-blur-[1px] rounded-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-150 dark:border-gray-800">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Uploading...</span>
              </div>
            </div>
          )}

          {isEditable && selected && !node.attrs.uploading && (
            <button
              type="button"
              aria-label="Resize image"
              onPointerDown={startResize}
              className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-[#2563EB] dark:bg-[#3B82F6]"
            />
          )}
        </div>
      </div>

      {/* Caption field directly under image */}
      <div className={`w-full flex ${getAlignClasses(align)}`}>
        <div style={{ width: node.attrs.width || "100%", maxWidth: "100%" }}>
          {isEditable ? (
            <input
              type="text"
              value={node.attrs.caption || ""}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              placeholder="Add caption for image..."
              className="w-full text-center text-xs mt-1.5 border-none outline-none focus:ring-0 bg-transparent text-gray-400 dark:text-gray-500 placeholder:text-gray-300 dark:placeholder:text-gray-800 print:placeholder:hidden"
            />
          ) : (
            node.attrs.caption && (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">
                {node.attrs.caption}
              </p>
            )
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width") || element.style.width || null,
        renderHTML: () => ({}),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.align || "center",
          style: getImageStyle(attributes),
        }),
      },
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("alt") || "",
        renderHTML: (attributes) => ({ alt: attributes.alt }),
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") || "",
        renderHTML: (attributes) => ({ "data-caption": attributes.caption }),
      },
      uploading: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-uploading") === "true",
        renderHTML: (attributes) => ({ "data-uploading": attributes.uploading ? "true" : undefined }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
