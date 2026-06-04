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
    const top = rect.bottom + 8;

    setPosition({ left, top });
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

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-[80] w-[250px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      style={{ left: position.left, top: position.top }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Insert Table</span>
        <span className="text-xs text-indigo-600 dark:text-indigo-300">
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
              className={`h-5 w-5 rounded-sm border transition ${
                active
                  ? "border-indigo-500 bg-indigo-100 dark:border-indigo-400 dark:bg-indigo-500/30"
                  : "border-gray-300 bg-white hover:border-indigo-300 dark:border-gray-600 dark:bg-gray-800"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-200">Customize</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-gray-500 dark:text-gray-400">
            Rows
            <input
              type="number"
              min={1}
              max={MAX_CUSTOM_SIZE}
              value={customRows}
              onChange={(event) => setCustomRows(Number(event.target.value))}
              className="mt-1 h-8 w-full rounded border border-gray-200 bg-white px-2 text-xs text-gray-900 outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>
          <label className="text-[11px] text-gray-500 dark:text-gray-400">
            Columns
            <input
              type="number"
              min={1}
              max={MAX_CUSTOM_SIZE}
              value={customCols}
              onChange={(event) => setCustomCols(Number(event.target.value))}
              className="mt-1 h-8 w-full rounded border border-gray-200 bg-white px-2 text-xs text-gray-900 outline-none focus:border-indigo-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={insertCustomTable}
          className="mt-3 h-8 w-full rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Insert table
        </button>
      </div>
    </div>,
    document.body,
  );
}
