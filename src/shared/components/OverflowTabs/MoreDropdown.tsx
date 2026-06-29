"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface OverflowItem {
  id: string;
  label: React.ReactNode;
  onSelect: () => void;
  isActive: boolean;
}

interface MoreDropdownProps {
  items: OverflowItem[];
}

const MoreDropdown = ({ items }: MoreDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 180 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasActive = items.some((item) => item.isActive);

  const updatePosition = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = Math.min(220, window.innerWidth - 16);
    setPosition({
      top: rect.bottom + 6,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - menuWidth - 8),
      width: menuWidth,
    });
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!btnRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => {
          updatePosition();
          setOpen((v) => !v);
        }}
        className={`whitespace-nowrap flex items-center gap-1 px-3 py-2 text-[0.8125rem] font-medium transition-all sm:px-5 rounded-[6px] ${
          hasActive
            ? "text-[#111111] dark:text-[#E8E8E7]"
            : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
        }`}
      >
        More ({items.length})
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-[100000] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-lg dark:border-[#333] dark:bg-[#202020]"
          >
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                  item.isActive
                    ? "bg-[#F7F6F3] text-[#111111] dark:bg-[#2E2E2E] dark:text-white"
                    : "text-[#787774] hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-[#2E2E2E]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export default MoreDropdown;
