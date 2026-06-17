"use client";

import { useEffect, useState } from "react";

import type { WorkspaceAvatarSource } from "@/modules/workspace/shared/utils/workspaceAvatar";
import {
  DEFAULT_WORKSPACE_AVATAR_URL,
  getWorkspaceAvatarInitial,
} from "@/modules/workspace/shared/utils/workspaceAvatar";

export type WorkspaceAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface WorkspaceAvatarProps {
  workspace?: WorkspaceAvatarSource | null;
  size?: WorkspaceAvatarSize;
  className?: string;
}

const sizeClasses: Record<WorkspaceAvatarSize, string> = {
  xs: "h-4 w-4 rounded-[3px] text-[0.625rem]",
  sm: "h-7 w-7 rounded-[6px] text-xs",
  md: "h-8 w-8 rounded-[6px] text-xs",
  lg: "h-12 w-12 rounded-[10px] text-sm",
  xl: "h-14 w-14 rounded-[10px] text-base",
};

// Fallback chain: custom avatar → viewavatar-1 (default) → initials
type FallbackStage = "custom" | "default" | "initials";

export default function WorkspaceAvatar({
  workspace,
  size = "md",
  className = "",
}: WorkspaceAvatarProps) {
  const customAvatar = workspace?.avatar || null;
  const initial = getWorkspaceAvatarInitial(workspace);

  const [stage, setStage] = useState<FallbackStage>(customAvatar ? "custom" : "default");

  // Reset stage when avatar prop changes (e.g. after sync from store)
  useEffect(() => {
    setStage(customAvatar ? "custom" : "default");
  }, [customAvatar]);

  const currentSrc = stage === "custom" ? customAvatar! : DEFAULT_WORKSPACE_AVATAR_URL;

  const handleError = () => {
    if (stage === "custom") setStage("default");
    else setStage("initials");
  };

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-[#2563EB] text-white dark:bg-[#3B82F6] ${sizeClasses[size]} ${className}`}
    >
      {stage !== "initials" ? (
        <img
          src={currentSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={handleError}
        />
      ) : (
        <span className="font-bold leading-none">{initial}</span>
      )}
    </span>
  );
}
