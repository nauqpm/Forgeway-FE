"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Tag } from "lucide-react";
import type { Issue } from "../../types/issue.type";
import type { TaskDetailResponse } from "../../types/task-detail.type";
import type { TaskLabel } from "../../types/label.type";
import TaskLabelModal from "./TaskLabelModal";

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
      { queryKey: ["tasks", workspaceId] },
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
      ["taskDetail", workspaceId, issue.key],
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
        className={`group flex min-h-[32px] w-full min-w-0 items-center gap-2 rounded p-1 text-left transition-colors ${
          disabled
            ? "cursor-default"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        {labels.length === 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Tag className="h-3.5 w-3.5" />
            None
          </span>
        ) : (
          <span className="flex min-w-0 flex-wrap gap-1.5">
            {labels.map((label) => (
              <span
                key={label.id}
                title={label.name}
                className={`max-w-full truncate rounded bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 ${
                  compact ? "text-[11px]" : "text-xs"
                }`}
              >
                {label.name}
              </span>
            ))}
          </span>
        )}
        {!disabled && (
          <Plus className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
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
