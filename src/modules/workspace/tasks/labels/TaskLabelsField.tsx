"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Tag } from "lucide-react";
import type { Issue } from "@/modules/workspace/shared/types/issue.type";
import type { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import type { TaskLabel } from "@/modules/workspace/shared/types/label.type";
import TaskLabelModal from "./TaskLabelModal";
import { queryKeys } from "@/shared/constants/queryKeys";

type TaskLabelsFieldProps = {
  workspaceId: string;
  issue: (Issue | TaskDetailResponse) & { id: string; key: string };
  disabled?: boolean;
  compact?: boolean;
};

export default function TaskLabelsField({
  workspaceId,
  issue,
  disabled = false,
  compact = false,
}: TaskLabelsFieldProps) {
  const queryClient = useQueryClient();
  const [labels, setLabels] = useState<TaskLabel[]>(issue.labels ?? []);
  const [labelIds, setLabelIds] = useState<string[]>(
    issue.labelIds ?? issue.labels?.map((label) => label.id) ?? [],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLabels(issue.labels ?? []);
    setLabelIds(issue.labelIds ?? issue.labels?.map((label) => label.id) ?? []);
  }, [issue]);

  const syncIssueLabels = (updatedIssue: Issue) => {
    const nextLabels = updatedIssue.labels ?? [];
    const nextLabelIds = updatedIssue.labelIds ?? nextLabels.map((label) => label.id);

    setLabels(nextLabels);
    setLabelIds(nextLabelIds);

    queryClient.setQueriesData<Issue[]>(
      { queryKey: queryKeys.tasks.byWorkspace(workspaceId) },
      (current) =>
        Array.isArray(current)
          ? current.map((item) =>
              item.id === updatedIssue.id
                ? { ...item, labels: nextLabels, labelIds: nextLabelIds }
                : item,
            )
          : current,
    );

    queryClient.setQueryData<TaskDetailResponse>(
      queryKeys.tasks.detail(workspaceId, issue.key),
      (current) =>
        current
          ? { ...current, labels: nextLabels, labelIds: nextLabelIds }
          : current,
    );
  };

  const labelsIssue = {
    ...issue,
    labels,
    labelIds,
  } as Issue;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!disabled) setIsModalOpen(true);
        }}
        disabled={disabled}
        className={`group flex min-h-8 w-full min-w-0 items-center gap-2 rounded p-1 text-left transition-colors ${
          disabled
            ? "cursor-default"
            : "hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
        }`}
      >
        {labels.length === 0 ? (
          <span className="flex items-center gap-1.5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            <Tag className="h-3.5 w-3.5" />
            None
          </span>
        ) : (
          <span className="flex min-w-0 flex-wrap gap-1.5">
            {labels.map((label) => (
              <span
                key={label.id}
                title={label.name}
                className={`max-w-full truncate rounded-[4px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] px-2 py-0.5 font-semibold text-[#1F6C9F] dark:text-[#93C5FD] ${
                  compact ? "text-[0.6875rem]" : "text-[0.6875rem]"
                }`}
              >
                {label.name}
              </span>
            ))}
          </span>
        )}
        {!disabled && (
          <Plus className="ml-auto h-3.5 w-3.5 shrink-0 text-[#ABABAB] dark:text-[#6B6B6B] opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </button>

      {isModalOpen && (
        <TaskLabelModal
          isOpen={isModalOpen}
          workspaceId={workspaceId}
          issue={labelsIssue}
          onClose={() => setIsModalOpen(false)}
          onSaved={syncIssueLabels}
        />
      )}
    </>
  );
}
