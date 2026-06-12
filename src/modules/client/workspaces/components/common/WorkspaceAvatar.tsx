"use client";

import { useState } from "react";

import type { WorkspaceAvatarSource } from "../../utils/workspaceAvatar";
import {
  getWorkspaceAvatarInitial,
  getWorkspaceAvatarUrl,
} from "../../utils/workspaceAvatar";

type WorkspaceAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface WorkspaceAvatarProps {
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

export default function WorkspaceAvatar({
  workspace,
  size = "md",
  className = "",
}: WorkspaceAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = getWorkspaceAvatarUrl(workspace);
  const initial = getWorkspaceAvatarInitial(workspace);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-[#2563EB] text-white dark:bg-[#3B82F6] ${sizeClasses[size]} ${className}`}
    >
      {!imageFailed && avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="font-bold leading-none">{initial}</span>
      )}
    </span>
  );
}
