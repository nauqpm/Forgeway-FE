"use client";

import React, { useRef } from "react";
import { useOverflowTabs } from "@/shared/hooks/useOverflowTabs";
import MoreDropdown from "./MoreDropdown";

// ─── Item ────────────────────────────────────────────────────────────────────

export interface OverflowTabsItemProps {
  /** Unique key matched against OverflowTabs activeId */
  id: string;
  onSelect: () => void;
  children: React.ReactNode;
  /** Injected by OverflowTabs — do not pass manually */
  isActive?: boolean;
}

const OverflowTabsItem = ({
  onSelect,
  children,
  isActive = false,
}: OverflowTabsItemProps) => (
  <button
    onClick={onSelect}
    className={`whitespace-nowrap px-3 py-2 text-[0.8125rem] font-medium transition-all sm:px-5 rounded-[6px] ${
      isActive
        ? "text-[#111111] dark:text-[#E8E8E7]"
        : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
    }`}
  >
    {children}
  </button>
);

// ─── Root ─────────────────────────────────────────────────────────────────────

interface OverflowTabsProps {
  activeId: string;
  children: React.ReactNode;
  className?: string;
}

function isTabItem(
  node: React.ReactNode
): node is React.ReactElement<OverflowTabsItemProps> {
  return React.isValidElement(node) && node.type === OverflowTabsItem;
}

const OverflowTabsRoot = ({ activeId, children, className }: OverflowTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Only collect valid Item children (nulls from conditional renders are filtered)
  const allItems = React.Children.toArray(children).filter(isTabItem);

  const visibleCount = useOverflowTabs(containerRef, measureRef, allItems.length);

  const allFit = visibleCount >= allItems.length;

  // Guarantee active tab is always in the visible strip
  const orderedItems = [...allItems];
  if (!allFit) {
    const activeIdx = orderedItems.findIndex((item) => item.props.id === activeId);
    const isActiveOverflowing = activeIdx >= visibleCount;

    if (isActiveOverflowing) {
      // Swap active tab with the last visible tab
      const lastVisibleIdx = visibleCount - 1;
      [orderedItems[lastVisibleIdx], orderedItems[activeIdx]] = [
        orderedItems[activeIdx],
        orderedItems[lastVisibleIdx],
      ];
    }
  }

  const visibleItems = allFit ? orderedItems : orderedItems.slice(0, visibleCount);
  const overflowItems = allFit ? [] : orderedItems.slice(visibleCount);

  return (
    <div className={`mb-2 w-full ${className ?? ""}`}>
      <div className="relative">
        {/* Hidden measurement layer — all items rendered to get natural widths */}
        <div
          ref={measureRef}
          className="invisible absolute flex items-center gap-1 pointer-events-none"
          aria-hidden
        >
          {allItems}
        </div>

        {/* Visible tab strip */}
        <div ref={containerRef} className="flex items-center gap-1">
          {visibleItems.map((item) =>
            React.cloneElement(item, { isActive: item.props.id === activeId })
          )}

          {overflowItems.length > 0 && (
            <MoreDropdown
              items={overflowItems.map((item) => ({
                id: item.props.id,
                label: item.props.children,
                onSelect: item.props.onSelect,
                isActive: item.props.id === activeId,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Compound export ──────────────────────────────────────────────────────────

export const OverflowTabs = Object.assign(OverflowTabsRoot, {
  Item: OverflowTabsItem,
});
