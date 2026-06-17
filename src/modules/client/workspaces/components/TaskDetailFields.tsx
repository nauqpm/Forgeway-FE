"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import AssigneePicker, {
  resolveMemberName,
  toAssigneePickerUsers,
} from "@/shared/components/AssigneePicker";
import TypePicker from "@/shared/components/TypePicker";
import PriorityPicker from "@/shared/components/PriorityPicker";
import CustomDatePicker from "@/shared/components/CustomDatePicker";
import TaskLabelsField from "@/modules/workspace/tasks/labels/TaskLabelsField";
import {
  toDateInputValue,
  getIssueAssigneeId,
  getUserDisplayName,
  type SprintOption,
} from "./task-detail-shared";

interface TaskDetailFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  issue: any;
  workspaceId: string;
  canEditTask: boolean;
  sprints?: SprintOption[];
  showSprintField?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspaceMembers: any[];
  /** Called with the partial update when any field changes */
  onUpdate: (updates: Record<string, unknown>) => void;
}

export default function TaskDetailFields({
  issue,
  workspaceId,
  canEditTask,
  sprints = [],
  showSprintField = false,
  workspaceMembers,
  onUpdate,
}: TaskDetailFieldsProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");

  const reporterName = getUserDisplayName(issue.reporter, issue.reporterId);
  const sprintLabel =
    issue.sprint?.name ||
    sprints.find((s) => (s._id || s.id) === issue.sprintId)?.name ||
    "None";
  const storyPointsLabel =
    issue.storyPoints === null || issue.storyPoints === undefined
      ? "None"
      : String(issue.storyPoints);
  const assigneeUsers = toAssigneePickerUsers(workspaceMembers);

  const editableTextClass =
    "text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1.5 -ml-1.5 rounded-[6px] cursor-pointer transition-colors";

  const startEdit = (field: string, value?: string | number | null) => {
    if (!canEditTask || issue.isArchived) return;
    setEditingField(field);
    setDraftValue(value === null || value === undefined ? "" : String(value));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraftValue("");
  };

  const saveEdit = (field: string, nextValue = draftValue) => {
    if (!canEditTask || issue.isArchived) {
      cancelEdit();
      return;
    }
    const value = nextValue.trim();
    const updates: Record<string, unknown> = {};

    if (field === "storyPoints") {
      updates.storyPoints = value === "" ? null : Number(value);
    } else if (field === "startDate") {
      const dueVal = toDateInputValue(issue.dueDate);
      if (value && dueVal && value > dueVal) {
        toast.error("Start date cannot be after due date.");
        cancelEdit();
        return;
      }
      updates.startDate = value || null;
    } else if (field === "dueDate") {
      const startVal = toDateInputValue(issue.startDate);
      if (value && startVal && value < startVal) {
        toast.error("Due date cannot be before start date.");
        cancelEdit();
        return;
      }
      updates.dueDate = value || null;
    } else if (field === "sprintId") {
      updates[field] = value || null;
    } else {
      updates[field] = value;
    }

    onUpdate(updates);
    cancelEdit();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
  ) => {
    if (e.key === "Enter") saveEdit(field);
    if (e.key === "Escape") cancelEdit();
  };

  const handleDateChange = (field: "startDate" | "dueDate", nextValue: string | null) => {
    if (!canEditTask || issue.isArchived) return;
    const nextDate = nextValue ?? "";
    if (field === "startDate") {
      const dueVal = toDateInputValue(issue.dueDate);
      if (nextDate && dueVal && nextDate > dueVal) {
        toast.error("Start date cannot be after due date.");
        return;
      }
    }
    if (field === "dueDate") {
      const startVal = toDateInputValue(issue.startDate);
      if (nextDate && startVal && nextDate < startVal) {
        toast.error("Due date cannot be before start date.");
        return;
      }
    }
    onUpdate({ [field]: nextValue ?? undefined });
  };

  const renderInlineInput = (
    field: string,
    displayValue: string,
    rawValue?: string | number | null,
    type: "text" | "number" = "text",
  ) =>
    canEditTask && editingField === field ? (
      <input
        autoFocus
        type={type}
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onBlur={() => saveEdit(field)}
        onKeyDown={(e) => handleKeyDown(e, field)}
        className="w-full rounded-[6px] border border-[#2563EB] bg-white dark:bg-[#252525] px-2 py-1 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] outline-none"
      />
    ) : (
      <div
        onDoubleClick={() => startEdit(field, rawValue ?? displayValue)}
        title={canEditTask && !issue.isArchived ? "Double click to edit" : undefined}
        className={
          canEditTask && !issue.isArchived
            ? editableTextClass
            : "text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] p-1.5 -ml-1.5"
        }
      >
        {displayValue}
      </div>
    );

  // Field row using Modal's standard grid-cols-3 layout
  const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] pt-1.5">{label}</div>
      <div className="col-span-2">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Assignee */}
      <FieldRow label="Assignee">
        <AssigneePicker
          users={assigneeUsers}
          value={getIssueAssigneeId(issue) || null}
          onChange={(uid) =>
            onUpdate({
              assigneeId: uid,
              assignee: uid ?? "U",
              assigneeDisplayName:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resolveMemberName(workspaceMembers as any[], uid ?? undefined) ??
                (uid ? uid : "Unassigned"),
            })
          }
          placement="auto"
          size="md"
          disabled={!canEditTask || issue.isArchived}
        />
      </FieldRow>

      {/* Type */}
      <FieldRow label="Type">
        <TypePicker
          value={issue.type ?? "Task"}
          onChange={(type) => onUpdate({ type })}
          disabled={!canEditTask || issue.isArchived}
          variant="pill"
          size="sm"
          placement="bottom"
        />
      </FieldRow>

      {/* Reporter */}
      <FieldRow label="Reporter">
        <div className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] p-1.5 -ml-1.5 rounded-[6px] cursor-pointer transition-colors">
          {reporterName}
        </div>
      </FieldRow>

      {/* Start date */}
      <FieldRow label="Start date">
        <CustomDatePicker
          value={toDateInputValue(issue.startDate)}
          onChange={(nextValue) => handleDateChange("startDate", nextValue)}
          disabled={!canEditTask || issue.isArchived}
          inputClassName="h-8 bg-transparent dark:bg-transparent"
          ariaLabel="Task start date"
        />
      </FieldRow>

      {/* Due date */}
      <FieldRow label="Due date">
        <CustomDatePicker
          value={toDateInputValue(issue.dueDate)}
          onChange={(nextValue) => handleDateChange("dueDate", nextValue)}
          disabled={!canEditTask || issue.isArchived}
          inputClassName="h-8 bg-transparent dark:bg-transparent"
          ariaLabel="Task due date"
        />
      </FieldRow>

      {/* Story points */}
      <FieldRow label="Story points">
        {renderInlineInput("storyPoints", storyPointsLabel, issue.storyPoints, "number")}
      </FieldRow>

      {/* Labels */}
      <FieldRow label="Labels">
        <TaskLabelsField
          workspaceId={workspaceId}
          issue={issue}
          disabled={!canEditTask || issue.isArchived}
        />
      </FieldRow>

      {/* Sprint (scrum only) */}
      {showSprintField && (
        <FieldRow label="Sprint">
          {renderInlineInput("sprintId", sprintLabel, issue.sprintId)}
        </FieldRow>
      )}

      {/* Priority */}
      <FieldRow label="Priority">
        <PriorityPicker
          value={issue.priority}
          onChange={(p) => onUpdate({ priority: p })}
          disabled={!canEditTask || issue.isArchived}
          variant="pill"
          size="sm"
        />
      </FieldRow>
    </div>
  );
}
