"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  Archive,
  Check,
  ChevronRight,
  CircleDot,
  Copy,
  Tag,
  Trash2,
} from "lucide-react";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { TaskCover } from "@/modules/workspace/shared/types/task-cover.type";
import { useTaskCoverActions } from "@/modules/workspace/shared/hooks/useTaskCoverActions";
import TaskCoverPickerPortal from "./TaskCoverPickerPortal";

type BoardTaskActionMenuProps = {
  workspaceId: string;
  workspaceKey: string;
  issue: Issue;
  columns: BoardColumn[];
  anchorRect: DOMRect | null;
  canArchiveTask: boolean;
  canEditTask: boolean;
  onClose: () => void;
  onArchiveIssue?: (issue: Issue) => void;
  onDeleteIssue?: (issue: Issue) => void;
  onOpenLabels?: (issue: Issue) => void;
  onUpdateIssue: (issueId: string, updates: Partial<Issue>) => void;
  onCoverChange: (issueId: string, cover: TaskCover | null) => void;
};

const MENU_WIDTH = 232;
const MENU_MAX_HEIGHT = 420;
const GAP = 8;
const PAD = 8;

const statusLabel = (column: BoardColumn) => column.name;

const getMenuPosition = (rect: DOMRect) => {
  const left = Math.min(
    Math.max(PAD, rect.right - MENU_WIDTH),
    Math.max(PAD, window.innerWidth - MENU_WIDTH - PAD),
  );
  const top = Math.min(rect.bottom + GAP, Math.max(PAD, window.innerHeight - MENU_MAX_HEIGHT - PAD));
  return { left, top };
};

export default function BoardTaskActionMenu({
  workspaceId,
  workspaceKey,
  issue,
  columns,
  anchorRect,
  canArchiveTask,
  canEditTask,
  onClose,
  onArchiveIssue,
  onDeleteIssue,
  onOpenLabels,
  onUpdateIssue,
  onCoverChange,
}: BoardTaskActionMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: PAD, top: PAD });
  const [statusOpen, setStatusOpen] = useState(false);
  const [coverAnchorRect, setCoverAnchorRect] = useState<DOMRect | null>(null);
  const coverRowRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleButtonMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setCoverAnchorRect(coverRowRef.current?.getBoundingClientRect() ?? null);
  };

  const handleButtonMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setCoverAnchorRect(null);
    }, 150);
  };

  const handlePopoverMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setCoverAnchorRect(coverRowRef.current?.getBoundingClientRect() ?? null);
  };

  const handlePopoverMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setCoverAnchorRect(null);
    }, 100);
  };
  const { saving, applyCover, removeCover } = useTaskCoverActions({
    workspaceId,
    issue,
    onCoverChange: (cover) => onCoverChange(issue.id, cover),
  });

  const taskLink = useMemo(() => {
    if (typeof window === "undefined") return issue.key;
    return `${window.location.origin}/workspaces/${workspaceKey}/board`;
  }, [issue.key, workspaceKey]);

  useLayoutEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!anchorRect) return;
    const updatePosition = () => setMenuPosition(getMenuPosition(anchorRect));
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRect]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onClose]);

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
      onClose();
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleStatusChange = (column: BoardColumn) => {
    onUpdateIssue(issue.id, {
      columnId: column.id,
      status: statusLabel(column),
    });
    onClose();
  };

  if (!mounted || !anchorRect) return null;

  return createPortal(
    <>
      <div
        ref={menuRef}
        className="fixed z-[999999] overflow-visible rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1 text-[#111111] dark:text-[#E8E8E7]"
        style={{ left: menuPosition.left, top: menuPosition.top, width: MENU_WIDTH, boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {canEditTask && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
            >
              <span className="flex items-center gap-2">
                <CircleDot className="h-4 w-4" />
                Change status
              </span>
              <ChevronRight className="h-4 w-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </button>
            {statusOpen && (
              <div
                className="absolute left-full top-0 ml-2 w-48 overflow-hidden rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] py-1"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
              >
                {columns.map((column) => {
                  const active = issue.columnId === column.id || issue.status === statusLabel(column);
                  return (
                    <button
                      key={column.id}
                      type="button"
                      onClick={() => handleStatusChange(column)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors ${
                        active
                          ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                          : "text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                      }`}
                    >
                      {statusLabel(column)}
                      {active && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => copyText(taskLink, "Task link copied")}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
        >
          <Copy className="h-4 w-4" />
          Copy link
        </button>
        <button
          type="button"
          onClick={() => copyText(issue.key, "Task key copied")}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
        >
          <Copy className="h-4 w-4" />
          Copy key
        </button>
        {canEditTask && (
          <>
            {/*<button
              type="button"
              onClick={() => {
                // TODO: Wire to flag API when task flags are available.
                onClose();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
            >
              <Flag className="h-4 w-4" />
              Add flag
            </button>*/}
            {onOpenLabels && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLabels(issue);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              >
                <Tag className="h-4 w-4" />
                Add label
              </button>
            )}
          </>
        )}
        {(canEditTask || canArchiveTask || onDeleteIssue) && (
          <div className="my-1 border-t border-[#EAEAEA] dark:border-white/[0.06]" />
        )}
        {canEditTask && (
          <button
            ref={coverRowRef}
            type="button"
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
          >
            <span>Select cover</span>
            <ChevronRight className="h-4 w-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
          </button>
        )}
        {canArchiveTask && onArchiveIssue && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onArchiveIssue(issue);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        )}
        {onDeleteIssue && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteIssue(issue);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171] transition-colors hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)]"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>

      <TaskCoverPickerPortal
        anchorRect={coverAnchorRect}
        cover={issue.cover}
        disabled={issue.isArchived}
        saving={saving}
        onApplyCover={applyCover}
        onRemoveCover={removeCover}
        onRequestClose={() => setCoverAnchorRect(null)}
        onMouseEnter={handlePopoverMouseEnter}
        onMouseLeave={handlePopoverMouseLeave}
      />
    </>,
    document.body,
  );
}
