// Component to select text and highlight colors in the editor, 
// supports saving the 8 most recent colors using localStorage.
// UI designed similarly to Google Docs with 2 distinct tabs for text and highlight color, 
// each displaying a different color palette. 
// Users can input a custom hex code or clear formatting to reset to default.  
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronDown, Highlighter, Palette, X } from "lucide-react";
import { stopUndoCapturing } from "./undoCapture";

type ColorMode = "text" | "highlight";

type Props = {
  editor: Editor;
};

const TEXT_COLORS = [
  ["#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF"],
  ["#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF"],
  ["#E6B8AF", "#F4CCCC", "#FCE5CD", "#FFF2CC", "#D9EAD3", "#D0E0E3", "#C9DAF8", "#CFE2F3", "#D9D2E9", "#EAD1DC"],
  ["#DD7E6B", "#EA9999", "#F9CB9C", "#FFE599", "#B6D7A8", "#A2C4C9", "#A4C2F4", "#9FC5E8", "#B4A7D6", "#D5A6BD"],
  ["#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0"],
  ["#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79"],
  ["#85200C", "#990000", "#B45F06", "#BF9000", "#38761D", "#134F5C", "#1155CC", "#0B5394", "#351C75", "#741B47"],
  ["#5B0F00", "#660000", "#783F04", "#7F6000", "#274E13", "#0C343D", "#1C4587", "#073763", "#20124D", "#4C1130"],
];

const HIGHLIGHT_COLORS = [
  "#FFF2CC",
  "#FFE599",
  "#FFD966",
  "#F4CCCC",
  "#FCE5CD",
  "#D9EAD3",
  "#D0E0E3",
  "#CFE2F3",
  "#D9D2E9",
  "#EAD1DC",
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#FF00FF",
  "#FF9900",
  "#FF0000",
];

const RECENT_KEY = "docs-editor-recent-colors";

const normalizeColor = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const getRecentColors = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
};

const saveRecentColor = (color: string) => {
  if (typeof window === "undefined") return;
  const next = [color, ...getRecentColors().filter((item) => item.toLowerCase() !== color.toLowerCase())].slice(0, 8);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};

export default function ColorPickerDropdown({ editor }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ColorMode>("text");
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const textColor = normalizeColor(editor.getAttributes("textStyle").color);
  const highlightColor = normalizeColor(editor.getAttributes("highlight").color);
  const activeColor = mode === "text" ? textColor || "#111827" : highlightColor || "#FFF2CC";

  const flatTextColors = useMemo(() => TEXT_COLORS.flat(), []);

  useEffect(() => {
    if (open) {
      setRecentColors(getRecentColors());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const applyColor = (color: string) => {
    stopUndoCapturing(editor);
    if (mode === "text") {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    stopUndoCapturing(editor);
    saveRecentColor(color);
    setRecentColors(getRecentColors());
    setOpen(false);
  };

  const clearColor = () => {
    stopUndoCapturing(editor);
    if (mode === "text") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
    stopUndoCapturing(editor);
    setOpen(false);
  };

  const renderSwatch = (color: string, size: "sm" | "md" = "md") => (
    <button
      key={color}
      type="button"
      title={color}
      aria-label={`Apply ${color}`}
      onClick={() => applyColor(color)}
      className={`rounded-[4px] border border-[#DADCE0] dark:border-white/[0.10] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 ${
        size === "sm" ? "h-5 w-5" : "h-6 w-6"
      }`}
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Text and highlight color"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 items-center gap-1 rounded-[6px] px-2 text-[#787774] dark:text-[#9B9A97] transition-all hover:bg-[#F7F6F3] hover:text-[#111111] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]"
      >
        {mode === "text" ? (
          <span className="flex h-5 w-5 flex-col items-center justify-center text-[0.75rem] font-bold leading-none">
            A
            <span className="mt-0.5 h-0.5 w-4 rounded-full" style={{ backgroundColor: activeColor }} />
          </span>
        ) : (
          <span className="relative flex h-5 w-5 items-center justify-center">
            <Highlighter className="h-4 w-4" />
            <span className="absolute bottom-0 h-0.5 w-4 rounded-full" style={{ backgroundColor: activeColor }} />
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-[272px] rounded-[8px] border border-[#EAEAEA] bg-white p-3 text-xs shadow-xl dark:border-white/[0.08] dark:bg-[#202020]">
          <div className="mb-3 grid grid-cols-2 rounded-[6px] bg-[#F7F6F3] p-0.5 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex h-8 items-center justify-center gap-1 rounded-[5px] font-semibold transition-colors ${
                mode === "text"
                  ? "bg-white text-[#111111] shadow-sm dark:bg-[#2A2A2A] dark:text-[#E8E8E7]"
                  : "text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              Text
            </button>
            <button
              type="button"
              onClick={() => setMode("highlight")}
              className={`flex h-8 items-center justify-center gap-1 rounded-[5px] font-semibold transition-colors ${
                mode === "highlight"
                  ? "bg-white text-[#111111] shadow-sm dark:bg-[#2A2A2A] dark:text-[#E8E8E7]"
                  : "text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7]"
              }`}
            >
              <Highlighter className="h-3.5 w-3.5" />
              Highlight
            </button>
          </div>

          {recentColors.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 font-semibold text-[#787774] dark:text-[#9B9A97]">Recent</div>
              <div className="flex flex-wrap gap-1">{recentColors.map((color) => renderSwatch(color, "sm"))}</div>
            </div>
          )}

          <div className="mb-3">
            <div className="mb-1.5 font-semibold text-[#787774] dark:text-[#9B9A97]">
              {mode === "text" ? "Text color" : "Highlight color"}
            </div>
            {mode === "text" ? (
              <div className="grid grid-cols-10 gap-1">{flatTextColors.map((color) => renderSwatch(color))}</div>
            ) : (
              <div className="grid grid-cols-8 gap-1">{HIGHLIGHT_COLORS.map((color) => renderSwatch(color))}</div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#EAEAEA] pt-3 dark:border-white/[0.08]">
            <label className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 font-semibold text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]">
              Custom
              <input
                type="color"
                className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                value={activeColor}
                onChange={(event) => applyColor(event.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={clearColor}
              className="flex items-center gap-1 rounded-[6px] px-2 py-1.5 font-semibold text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)]"
            >
              <X className="h-3.5 w-3.5" />
              {mode === "text" ? "Default" : "No highlight"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
