"use client";

import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Columns,
  Grid,
  Rows,
  Sparkles,
  Trash2,
} from "lucide-react";

interface TableContextMenuProps {
  editor: Editor;
  x: number;
  y: number;
  onClose: () => void;
}

const COLORS = [
  { name: "No color", value: null },
  { name: "Light gray", value: "#F3F4F6" },
  { name: "Light red", value: "#FEE2E2" },
  { name: "Light blue", value: "#DBEAFE" },
  { name: "Light green", value: "#D1FAE5" },
  { name: "Light yellow", value: "#FEF3C7" },
  { name: "Light purple", value: "#F3E8FF" },
];

export default function TableContextMenu({ editor, x, y, onClose }: TableContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ left: x, top: y });
  const canMergeCells = editor.can().mergeCells();
  const canSplitCell = editor.can().splitCell();

  useEffect(() => {
    if (!menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (x + rect.width > viewportWidth) {
      left = viewportWidth - rect.width - 12;
    }

    if (y + rect.height > viewportHeight) {
      top = viewportHeight - rect.height - 12;
    }

    setPosition({ left, top });
  }, [x, y]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const runCommand = (action: () => void) => {
    action();
    onClose();
  };

  const setCellBg = (color: string | null) => {
    editor.chain().focus().setCellAttribute("backgroundColor", color).run();
    onClose();
  };

  const menuBtnCls =
    "w-full text-left text-xs px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors";

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] w-56 rounded-lg border border-gray-200/80 bg-white py-1 shadow-xl dark:border-gray-800 dark:bg-gray-950"
      style={{ left: position.left, top: position.top }}
      onClick={(e) => e.stopPropagation()}
    >
      {(canMergeCells || canSplitCell) && (
        <>
          {canMergeCells && (
            <button
              onClick={() => runCommand(() => editor.chain().focus().mergeCells().run())}
              className={menuBtnCls}
            >
              <Grid className="h-3.5 w-3.5" />
              Merge selected cells
            </button>
          )}
          {canSplitCell && (
            <button
              onClick={() => runCommand(() => editor.chain().focus().splitCell().run())}
              className={menuBtnCls}
            >
              <Grid className="h-3.5 w-3.5" />
              Split merged cell
            </button>
          )}

          <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
        </>
      )}

      <button
        onClick={() => runCommand(() => editor.chain().focus().addRowBefore().run())}
        className={menuBtnCls}
      >
        <ArrowUp className="h-3.5 w-3.5" />
        Insert row above
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().addRowAfter().run())}
        className={menuBtnCls}
      >
        <ArrowDown className="h-3.5 w-3.5" />
        Insert row below
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().addColumnBefore().run())}
        className={menuBtnCls}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Insert column left
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().addColumnAfter().run())}
        className={menuBtnCls}
      >
        <ArrowRight className="h-3.5 w-3.5" />
        Insert column right
      </button>

      <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />

      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Cell background
      </div>
      <div className="flex flex-wrap gap-1 px-3 py-1.5">
        {COLORS.map((color) => (
          <button
            key={color.name}
            onClick={() => setCellBg(color.value)}
            title={color.name}
            className="relative flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white transition-transform hover:scale-110 dark:border-gray-800"
            style={{ backgroundColor: color.value ?? "transparent" }}
          >
            {color.value === null && <Sparkles className="h-2.5 w-2.5 text-gray-400" />}
          </button>
        ))}
      </div>

      <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />

      <button
        onClick={() => runCommand(() => editor.chain().focus().deleteRow().run())}
        className={menuBtnCls}
      >
        <Rows className="h-3.5 w-3.5 text-red-500" />
        Delete current row
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().deleteColumn().run())}
        className={menuBtnCls}
      >
        <Columns className="h-3.5 w-3.5 text-red-500" />
        Delete current column
      </button>
      <button
        onClick={() => runCommand(() => editor.chain().focus().deleteTable().run())}
        className={`${menuBtnCls} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20`}
      >
        <Trash2 className="h-3.5 w-3.5 text-red-600" />
        Delete entire table
      </button>
    </div>,
    document.body,
  );
}
