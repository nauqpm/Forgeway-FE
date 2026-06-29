"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Measures how many tab items fit inside a container before overflowing.
 * Uses a hidden measurement container (measureRef) that renders all items
 * at their natural size, then computes the cut-off based on containerRef width.
 *
 * @param containerRef    - the visible flex row (ResizeObserver target)
 * @param measureRef      - hidden div rendering all items for width measurement
 * @param itemCount       - total items; triggers re-compute when it changes
 * @param moreButtonWidth - space reserved for the "More (N)" button (default 100px)
 * @returns visibleCount  - number of items to show before the More button
 */
export function useOverflowTabs(
  containerRef: React.RefObject<HTMLElement | null>,
  measureRef: React.RefObject<HTMLElement | null>,
  itemCount: number,
  moreButtonWidth = 100
): number {
  const [visibleCount, setVisibleCount] = useState(itemCount);

  const compute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const containerWidth = container.offsetWidth;
    const itemEls = Array.from(measure.children) as HTMLElement[];
    if (itemEls.length === 0) return;

    let totalWidth = 0;
    let fits = 0;

    for (let i = 0; i < itemEls.length; i++) {
      const itemWidth = itemEls[i].offsetWidth + 4; // 4px gap
      const isLastItem = i === itemEls.length - 1;
      // Only reserve space for More button when it will actually be needed
      const budget = isLastItem ? containerWidth : containerWidth - moreButtonWidth;

      if (totalWidth + itemWidth <= budget) {
        totalWidth += itemWidth;
        fits++;
      } else {
        break;
      }
    }

    setVisibleCount(Math.max(fits, 1));
  }, [containerRef, measureRef, moreButtonWidth]);

  // Re-compute when item count changes (e.g. scrum-only tab toggled)
  useEffect(() => {
    compute();
  }, [compute, itemCount]);

  // Watch container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(compute);
    observer.observe(container);
    compute();

    return () => observer.disconnect();
  }, [compute, containerRef]);

  return visibleCount;
}
