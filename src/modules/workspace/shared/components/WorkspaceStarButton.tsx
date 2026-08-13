"use client";

import { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { queryKeys } from "@/shared/constants/queryKeys";
import { workspaceService } from "../services/workspaceService";
import type { Workspace } from "../types/workspace.type";

interface WorkspaceStarButtonProps {
  workspace: Workspace;
  className?: string;
}

export default function WorkspaceStarButton({
  workspace,
  className = "",
}: WorkspaceStarButtonProps) {
  const queryClient = useQueryClient();
  const isStarred = workspace.isStarred ?? false;

  const toggle = async () => {
    const next = !isStarred;
    const previousList = queryClient.getQueryData<Workspace[]>(queryKeys.workspaces.list());
    const previousStarred = queryClient.getQueryData<Workspace[]>(queryKeys.workspaces.starred());

    const patchWorkspace = (item: Workspace) =>
      item._id === workspace._id ? { ...item, isStarred: next } : item;
    queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.list(), (current = []) =>
      current.map(patchWorkspace),
    );
    queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.starred(), (current = []) => {
      if (next) {
        const starredWorkspace = { ...workspace, isStarred: true };
        return current.some(item => item._id === workspace._id)
          ? current.map(patchWorkspace)
          : [...current, starredWorkspace].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      }
      return current.filter(item => item._id !== workspace._id);
    });

    try {
      await workspaceService.setWorkspaceStar(workspace._id, next);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.starred() });
    } catch {
      queryClient.setQueryData(queryKeys.workspaces.list(), previousList);
      queryClient.setQueryData(queryKeys.workspaces.starred(), previousStarred);
      toast.error("Could not update starred workspace.");
    }
  };

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void toggle();
  };

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    void toggle();
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={isStarred ? "Unstar workspace" : "Star workspace"}
      title={isStarred ? "Unstar workspace" : "Star workspace"}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={`inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${className}`}
    >
      <Star
        className={`h-4 w-4 transition-colors ${
          isStarred
            ? "fill-amber-500 text-amber-500"
            : "fill-transparent text-black dark:text-[#9B9A97]"
        }`}
      />
    </span>
  );
}
