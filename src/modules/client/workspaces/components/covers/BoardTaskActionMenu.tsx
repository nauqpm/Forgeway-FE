"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  Archive,
  Check,
  ChevronRight,
  CircleDot,
  Copy,
  Flag,
  Tag,
  Trash2,
} from "lucide-react";
import type { BoardColumn } from "../../types/board.type";
import type { Issue } from "../../types/issue.type";
import type { TaskCover } from "../../types/task-cover.type";
import { useTaskCoverActions } from "../../hooks/useTaskCoverActions";
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
  const { saving, applyCover, removeCover } = useTaskCoverActions({
    workspaceId,
    issue,
    onCoverChange: (cover) => onCoverChange(issue.id, cover),
  });

  const taskLink = useMemo(() => {
    if (typeof window === "undefined") return issue.key;
    return `${window.location.origin}/workspaces/${workspaceKey}/board/key/${issue.key}`;
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
        className="fixed z-[999999] w-58 overflow-visible rounded-lg border border-gray-700 bg-gray-900 py-1 text-gray-100 shadow-2xl"
        style={{ left: menuPosition.left, top: menuPosition.top, width: MENU_WIDTH }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
          >
            <span className="flex items-center gap-2">
              <CircleDot className="h-4 w-4" />
              Change status
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
          {statusOpen && (
            <div className="absolute left-full top-0 ml-2 w-48 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-2xl">
              {columns.map((column) => {
                const active = issue.columnId === column.id || issue.status === statusLabel(column);
                return (
                  <button
                    key={column.id}
                    type="button"
                    onClick={() => handleStatusChange(column)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      active ? "bg-gray-800 text-blue-300" : "text-gray-200 hover:bg-gray-800"
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

        <button
          type="button"
          onClick={() => copyText(taskLink, "Task link copied")}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
        >
          <Copy className="h-4 w-4" />
          Copy link
        </button>
        <button
          type="button"
          onClick={() => copyText(issue.key, "Task key copied")}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
        >
          <Copy className="h-4 w-4" />
          Copy key
        </button>
        <button
          type="button"
          onClick={() => {
            // TODO: Wire to flag API when task flags are available.
            onClose();
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
        >
          <Flag className="h-4 w-4" />
          Add flag
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenLabels?.(issue);
          }}
          disabled={!onOpenLabels || !canEditTask}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
        >
          <Tag className="h-4 w-4" />
          Add label
        </button>
        <div className="my-1 border-t border-gray-800" />
        {canEditTask && (
          <button
            ref={coverRowRef}
            type="button"
            onMouseEnter={() => setCoverAnchorRect(coverRowRef.current?.getBoundingClientRect() ?? null)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
          >
            <span>Select cover</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onClose();
            onArchiveIssue?.(issue);
          }}
          disabled={!onArchiveIssue || !canArchiveTask}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Archive className="h-4 w-4" />
          Archive
        </button>
        {onDeleteIssue && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteIssue(issue);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 transition-colors hover:bg-red-950/40"
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
        onMouseEnter={() => setCoverAnchorRect(coverRowRef.current?.getBoundingClientRect() ?? null)}
        onMouseLeave={() => setCoverAnchorRect(null)}
      />
    </>,
    document.body,
  );
}
