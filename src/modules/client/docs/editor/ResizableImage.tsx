"use client";

import Image from "@tiptap/extension-image";
import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, RotateCcw, Trash2 } from "lucide-react";
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
      className={`group my-4 flex ${getAlignClasses(align)}`}
      contentEditable={false}
      data-align={align}
    >
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
          className="block h-auto max-w-full rounded-sm"
          style={{ width: node.attrs.width || undefined }}
        />

        {isEditable && selected && (
          <button
            type="button"
            aria-label="Resize image"
            onPointerDown={startResize}
            className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-[#2563EB] dark:bg-[#3B82F6]"
          />
        )}
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
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
