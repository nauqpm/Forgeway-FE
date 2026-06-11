// Table grid picker component to select rows and columns when inserting a table,
// allowing users to choose table size visually by hovering over grid or entering custom dimensions.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TableGridPickerProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (rows: number, cols: number) => void;
};

const GRID_ROWS = 8;
const GRID_COLS = 8;
const MAX_CUSTOM_SIZE = 50;
const PICKER_WIDTH = 250;
const VIEWPORT_MARGIN = 12;

export default function TableGridPicker({ anchorEl, onClose, onSelect }: TableGridPickerProps) {
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState({ rows: 3, cols: 3 });
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);

  const updatePosition = useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      window.innerWidth - PICKER_WIDTH - VIEWPORT_MARGIN,
    );
    setPosition({ left, top: rect.bottom + 8 });
  }, [anchorEl]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !anchorEl?.contains(target)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    setMounted(true);
    updatePosition();
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorEl, onClose, updatePosition]);

  const insertCustomTable = () => {
    const rows = Math.min(MAX_CUSTOM_SIZE, Math.max(1, Math.floor(customRows)));
    const cols = Math.min(MAX_CUSTOM_SIZE, Math.max(1, Math.floor(customCols)));
    onSelect(rows, cols);
  };

  if (!mounted) return null;

  const inputCls = "mt-1 h-8 w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] px-2 text-[0.6875rem] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors";

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-[80] w-[15.625rem] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-3"
      style={{ left: position.left, top: position.top, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.6875rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Insert Table</span>
        <span className="text-[0.6875rem] text-[#2563EB] dark:text-[#3B82F6]">
          {hovered.rows} x {hovered.cols}
        </span>
      </div>

      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, index) => {
          const row = Math.floor(index / GRID_COLS) + 1;
          const col = (index % GRID_COLS) + 1;
          const active = row <= hovered.rows && col <= hovered.cols;
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              aria-label={`Insert ${row} by ${col} table`}
              onMouseEnter={() => setHovered({ rows: row, cols: col })}
              onClick={() => onSelect(row, col)}
              className={`h-5 w-5 rounded-sm border transition-colors ${
                active
                  ? "border-[#2563EB] bg-[#EFF6FF] dark:border-[#3B82F6] dark:bg-[rgba(37,99,235,0.15)]"
                  : "border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] hover:border-[#2563EB]/50"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-3 border-t border-[#EAEAEA] dark:border-white/[0.06] pt-3">
        <div className="mb-2 text-[0.6875rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Customize</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
            Rows
            <input type="number" min={1} max={MAX_CUSTOM_SIZE} value={customRows} onChange={(e) => setCustomRows(Number(e.target.value))} className={inputCls} />
          </label>
          <label className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
            Columns
            <input type="number" min={1} max={MAX_CUSTOM_SIZE} value={customCols} onChange={(e) => setCustomCols(Number(e.target.value))} className={inputCls} />
          </label>
        </div>
        <button
          type="button"
          onClick={insertCustomTable}
          className="mt-3 h-8 w-full rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 text-[0.6875rem] font-semibold text-white hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
        >
          Insert table
        </button>
      </div>
    </div>,
    document.body,
  );
}
