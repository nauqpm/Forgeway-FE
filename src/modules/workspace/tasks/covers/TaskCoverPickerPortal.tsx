"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import TaskCoverPopover from "./TaskCoverPopover";
import type { TaskCover } from "@/modules/workspace/shared/types/task-cover.type";

type TaskCoverPickerPortalProps = {
  anchorRect: DOMRect | null;
  cover?: TaskCover | null;
  disabled?: boolean;
  saving?: boolean;
  onApplyCover: (cover: TaskCover) => Promise<void> | void;
  onRemoveCover: () => Promise<void> | void;
  onRequestClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

const PICKER_WIDTH = 336;
const PICKER_HEIGHT = 470;
const GAP = 8;
const VIEWPORT_PAD = 8;

const getPosition = (anchorRect: DOMRect) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const canOpenRight = anchorRect.right + GAP + PICKER_WIDTH <= viewportWidth - VIEWPORT_PAD;
  const left = canOpenRight
    ? anchorRect.right + GAP
    : Math.max(VIEWPORT_PAD, anchorRect.left - GAP - PICKER_WIDTH);
  const top = Math.min(
    Math.max(VIEWPORT_PAD, anchorRect.top),
    Math.max(VIEWPORT_PAD, viewportHeight - PICKER_HEIGHT - VIEWPORT_PAD),
  );

  return { left, top };
};

export default function TaskCoverPickerPortal({
  anchorRect,
  cover,
  disabled,
  saving,
  onApplyCover,
  onRemoveCover,
  onRequestClose,
  onMouseEnter,
  onMouseLeave,
}: TaskCoverPickerPortalProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ left: VIEWPORT_PAD, top: VIEWPORT_PAD });

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!anchorRect) return;
    const updatePosition = () => setPosition(getPosition(anchorRect));
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRect]);

  if (!mounted || !anchorRect) return null;

  return createPortal(
    <div
      className="fixed z-[1000000]"
      style={{ left: position.left, top: position.top }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <TaskCoverPopover
        cover={cover}
        disabled={disabled}
        saving={saving}
        onApplyCover={onApplyCover}
        onRemoveCover={onRemoveCover}
        onRequestClose={onRequestClose}
      />
    </div>,
    document.body,
  );
}
