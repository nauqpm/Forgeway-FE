"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import type { TaskCover } from "@/modules/workspace/shared/types/task-cover.type";
import TaskCoverPickerPortal from "./TaskCoverPickerPortal";
import { useTaskCoverActions } from "@/modules/workspace/shared/hooks/useTaskCoverActions";
import { taskCoverService } from "@/modules/workspace/shared/services/taskCoverService";

type CoverableIssue = {
  id: string;
  key?: string;
  isArchived?: boolean;
  cover?: TaskCover | null;
};

type TaskCoverBannerProps<TIssue extends CoverableIssue> = {
  workspaceId: string;
  issue: TIssue;
  maxHeightClass?: string;
  colorHeightClass?: string;
  onIssueCoverChange?: (cover: TaskCover | null) => void;
  onSettledCover?: (cover: TaskCover | null) => void;
};

export default function TaskCoverBanner<TIssue extends CoverableIssue>({
  workspaceId,
  issue,
  maxHeightClass = "h-32",
  colorHeightClass = "h-16",
  onIssueCoverChange,
  onSettledCover,
}: TaskCoverBannerProps<TIssue>) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const { saving, applyCover, removeCover } = useTaskCoverActions({
    workspaceId,
    issue,
    onCoverChange: (cover) => onIssueCoverChange?.(cover),
    onSettledCover,
  });

  useEffect(() => {
    let cancelled = false;

    taskCoverService
      .getCover(workspaceId, issue.id)
      .then((cover) => {
        if (!cancelled) onIssueCoverChange?.(cover);
      })
      .catch(() => {
        if (!cancelled) onIssueCoverChange?.(issue.cover ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [issue.cover, issue.id, onIssueCoverChange, workspaceId]);

  if (!issue.cover) return null;

  const bannerHeightClass = issue.cover.type === "color" ? colorHeightClass : maxHeightClass;

  return (
    <div className={`relative w-full shrink-0 overflow-hidden ${bannerHeightClass}`}>
      {issue.cover.type === "image" ? (
        <img
          src={issue.cover.imageUrl}
          alt=""
          className="h-full max-h-full w-full object-cover object-center"
        />
      ) : (
        <div className="h-full w-full" style={{ background: issue.cover.color }} />
      )}
      <button
        ref={editButtonRef}
        type="button"
        disabled={issue.isArchived}
        onClick={(event) => {
          event.stopPropagation();
          setAnchorRect(editButtonRef.current?.getBoundingClientRect() ?? null);
        }}
        className="absolute bottom-2 right-2 inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#111111]/85 px-2.5 text-[0.6875rem] font-semibold text-white transition-colors hover:bg-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        Edit Cover
      </button>
      <TaskCoverPickerPortal
        anchorRect={anchorRect}
        cover={issue.cover}
        disabled={issue.isArchived}
        saving={saving}
        onApplyCover={applyCover}
        onRemoveCover={removeCover}
        onRequestClose={() => setAnchorRect(null)}
      />
    </div>
  );
}
