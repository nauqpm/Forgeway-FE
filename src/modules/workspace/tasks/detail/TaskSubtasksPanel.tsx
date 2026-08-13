import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Check, Loader2, Layers, FileText, Trash2 } from "lucide-react";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import { useSubtasks } from "@/modules/workspace/shared/hooks/useSubtasks";
import toast from "react-hot-toast";
import AssigneePicker, { toAssigneePickerUsers } from "@/shared/components/AssigneePicker";
import StatusPicker from "@/shared/components/StatusPicker";
import PriorityPicker from "@/shared/components/PriorityPicker";
import type { TaskStatusColumn } from "@/modules/workspace/shared/utils/taskStatusColumns";
import type { WorkspaceMember } from "./task-detail-shared";
import ConvertSubtaskConfirmModal from "./ConvertSubtaskConfirmModal";
import DeleteSubtaskConfirmModal from "./DeleteSubtaskConfirmModal";
interface TaskSubtasksPanelProps {
  issue: TaskDetailResponse;
  workspaceId: string;
  canEditTask: boolean;
  onSubtaskClick?: (subtaskId: string) => void;
  workspaceMembers?: WorkspaceMember[];
  boardColumns?: TaskStatusColumn[];
}

function SubtaskActionMenu({ onConvert, onDelete, disabled }: { onConvert: () => void, onDelete: () => void, disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    const closeOnScroll = () => setOpen(false);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({ top: rect.bottom + 4, left: rect.right - 160 }); 
    }
    setOpen((p) => !p);
  };

  return (
    <div className={`absolute right-2 transition-opacity bg-white dark:bg-[#202020] rounded shadow-sm border border-[#EAEAEA] dark:border-white/[0.06] flex items-center ${open ? 'opacity-100 z-50' : 'opacity-0 group-hover:opacity-100'}`} ref={rootRef}>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        disabled={disabled}
        className="p-1 rounded text-[#787774] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] transition-all disabled:opacity-50"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-[100000] w-40 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] shadow-lg overflow-hidden py-1"
          style={dropdownStyle}
        >
          <button
            onMouseDown={(e) => { e.stopPropagation(); setOpen(false); onConvert(); }}
            className="w-full text-left px-3 py-1.5 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F9F9F8] dark:hover:bg-[#2A2A2A] flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-[#787774]" />
            Convert to Task
          </button>
          <button
            onMouseDown={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full text-left px-3 py-1.5 text-[0.8125rem] text-[#DC2626] hover:bg-[#F9F9F8] dark:hover:bg-[#2A2A2A] flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function TaskSubtasksPanel({
  issue,
  workspaceId,
  canEditTask,
  onSubtaskClick,
  workspaceMembers,
  boardColumns = [],
}: TaskSubtasksPanelProps) {
  const [subtaskIdToConvert, setSubtaskIdToConvert] = useState<string | null>(null);
  const [subtaskTitleToConvert, setSubtaskTitleToConvert] = useState<string>("");
  const [subtaskToDelete, setSubtaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const { subtasks, isLoading, progress, createSubtask, convertToTask, updateSubtask, deleteSubtask } = useSubtasks(workspaceId, issue.id);
  const assigneeUsers = toAssigneePickerUsers(workspaceMembers as never[]);
  const [isAdding, setIsAdding] = useState(false);
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
  const isExpanded = userExpanded !== null ? userExpanded : (subtasks.length > 0 || isAdding);
  const setIsExpanded = (val: boolean) => setUserExpanded(val);
  const [newTitle, setNewTitle] = useState("");

  const [colWidths, setColWidths] = useState({
    work: 50,
    priority: 15,
    assignee: 15,
    status: 20
  });

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidths, setStartWidths] = useState(colWidths);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const table = document.getElementById("subtask-table-header");
      const tableWidth = table ? table.offsetWidth : 800;
      const diffPercent = ((e.clientX - startX) / tableWidth) * 100;

      setColWidths(() => {
        const next = { ...startWidths };
        if (isResizing === "work") {
          let delta = diffPercent;
          if (startWidths.priority - delta < 5) delta = startWidths.priority - 5;
          if (startWidths.work + delta < 15) delta = 15 - startWidths.work;
          next.work = startWidths.work + delta;
          next.priority = startWidths.priority - delta;
        } else if (isResizing === "priority") {
          let delta = diffPercent;
          if (startWidths.assignee - delta < 5) delta = startWidths.assignee - 5;
          if (startWidths.priority + delta < 5) delta = 5 - startWidths.priority;
          next.priority = startWidths.priority + delta;
          next.assignee = startWidths.assignee - delta;
        } else if (isResizing === "assignee") {
          let delta = diffPercent;
          if (startWidths.status - delta < 10) delta = startWidths.status - 10;
          if (startWidths.assignee + delta < 5) delta = 5 - startWidths.assignee;
          next.assignee = startWidths.assignee + delta;
          next.status = startWidths.status - delta;
        }
        return next;
      });
    };
    const handleMouseUp = () => {
      setIsResizing(null);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, startX, startWidths]);

  const handleMouseDown = (e: React.MouseEvent, col: string) => {
    setIsResizing(col);
    setStartX(e.clientX);
    setStartWidths(colWidths);
    e.preventDefault();
  };

  if (issue.type?.toLowerCase() === "subtask" || issue.type?.toLowerCase() === "epic") return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createSubtask.mutateAsync({ title: newTitle.trim() });
      setNewTitle("");
      setIsAdding(false);
      toast.success("Subtask created");
    } catch {
      toast.error("Failed to create subtask");
    }
  };

  const handleConvertToTask = async (subtaskId: string) => {
    try {
      await convertToTask.mutateAsync(subtaskId);
      toast.success(
        subtaskTitleToConvert
          ? `Successfully converted "${subtaskTitleToConvert}" to task`
          : "Successfully converted to task"
      );
      setSubtaskIdToConvert(null);
      setSubtaskTitleToConvert("");
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to convert subtask";
      toast.error(message);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask.mutateAsync(subtaskId);
      toast.success(
        subtaskToDelete?.title
          ? `Successfully deleted subtask "${subtaskToDelete.title}"`
          : "Successfully deleted subtask"
      );
      setSubtaskToDelete(null);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete subtask";
      toast.error(message);
    }
  };

  const percentDone = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between group">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] hover:text-[#2563EB] transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Subtasks
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[#EAEAEA] dark:bg-[#333333] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#787774] dark:bg-[#9B9A97] transition-all duration-300"
                style={{ width: `${percentDone}%` }}
              />
            </div>
            <span className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] min-w-[3rem] text-right">
              {percentDone}% Done
            </span>
          </div>

          {/* Table */}
          <div className="border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#202020] overflow-hidden flex flex-col w-full">
            <div className="w-full flex flex-col">
              {/* Table Header */}
              <div id="subtask-table-header" className="flex items-center w-full bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.06] text-[0.75rem] font-semibold text-[#787774] dark:text-[#9B9A97]">
                <div style={{ width: `${colWidths.work}%` }} className="relative shrink-0 p-2.5 pl-3 border-r border-[#EAEAEA] dark:border-white/[0.06] truncate">
                  Work
                  <div onMouseDown={(e) => handleMouseDown(e, "work")} className="absolute right-0 top-0 bottom-0 w-2 translate-x-1/2 cursor-col-resize z-10 group/resizer">
                    <div className="w-0.5 h-full mx-auto bg-transparent group-hover/resizer:bg-[#2563EB] transition-colors" />
                  </div>
                </div>
                <div style={{ width: `${colWidths.priority}%` }} className="relative shrink-0 p-2.5 border-r border-[#EAEAEA] dark:border-white/[0.06] truncate">
                  Priority
                  <div onMouseDown={(e) => handleMouseDown(e, "priority")} className="absolute right-0 top-0 bottom-0 w-2 translate-x-1/2 cursor-col-resize z-10 group/resizer">
                    <div className="w-0.5 h-full mx-auto bg-transparent group-hover/resizer:bg-[#2563EB] transition-colors" />
                  </div>
                </div>
                <div style={{ width: `${colWidths.assignee}%` }} className="relative shrink-0 p-2.5 border-r border-[#EAEAEA] dark:border-white/[0.06] truncate">
                  Assignee
                  <div onMouseDown={(e) => handleMouseDown(e, "assignee")} className="absolute right-0 top-0 bottom-0 w-2 translate-x-1/2 cursor-col-resize z-10 group/resizer">
                    <div className="w-0.5 h-full mx-auto bg-transparent group-hover/resizer:bg-[#2563EB] transition-colors" />
                  </div>
                </div>
                <div style={{ width: `${colWidths.status}%` }} className="relative shrink-0 p-2.5 truncate">
                  Status
                </div>
              </div>

              {/* Table Body */}
              {isLoading ? (
                <div className="p-4 flex justify-center text-[#ABABAB]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : subtasks.length === 0 && !isAdding ? (
                <div className="p-4 text-[0.8125rem] text-[#ABABAB] dark:text-[#6B6B6B] text-center">
                  No subtasks yet
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#EAEAEA] dark:divide-white/[0.06] w-full">
                  {subtasks.map((st) => {
                    const stCol = boardColumns.find((c) => c.id === st.status || c.name === st.status);
                    const stDone = stCol?.isDone || (stCol?.name ?? st.status ?? "").toLowerCase().includes("done");
                    return (
                    <div key={st.id} className="flex items-center w-full hover:bg-[#F9F9F8] dark:hover:bg-[#2A2A2A] transition-colors relative group">
                      {/* Work Column */}
                      <div style={{ width: `${colWidths.work}%` }} className="shrink-0 flex items-center gap-2 p-2.5 pl-3 border-r border-[#EAEAEA] dark:border-white/[0.06] cursor-pointer" onClick={() => onSubtaskClick?.(st.key || st.id)}>
                        <Layers className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                        <span className={`text-[0.8125rem] font-mono shrink-0 ${stDone ? "line-through text-[#ABABAB] dark:text-[#6B6B6B]" : "text-[#2563EB] hover:underline"}`}>
                          {st.key}
                        </span>
                        <span className="text-[0.8125rem] truncate text-[#111111] dark:text-[#E8E8E7]">
                          {st.title}
                        </span>
                      </div>

                      {/* Priority Column */}
                      <div style={{ width: `${colWidths.priority}%` }} className="shrink-0 flex items-center p-2.5 border-r border-[#EAEAEA] dark:border-white/[0.06] truncate">
                        <PriorityPicker
                          value={st.priority}
                          onChange={(newPriority) => {
                            updateSubtask.mutate({ subtaskId: st.id, updates: { priority: newPriority } });
                          }}
                          disabled={!canEditTask || issue.isArchived}
                          variant="pill"
                          size="sm"
                        />
                      </div>

                      {/* Assignee Column */}
                      <div style={{ width: `${colWidths.assignee}%` }} className="shrink-0 flex items-center p-2.5 border-r border-[#EAEAEA] dark:border-white/[0.06] truncate">
                        <AssigneePicker
                          value={st.assigneeId}
                          users={assigneeUsers}
                          onChange={(newId: string | null) => {
                            updateSubtask.mutate({ subtaskId: st.id, updates: { assigneeId: newId || null } });
                          }}
                          disabled={!canEditTask}
                        />
                      </div>

                      {/* Status Column */}
                      <div style={{ width: `${colWidths.status}%` }} className="shrink-0 flex items-center p-2.5 relative truncate">
                        <StatusPicker
                          value={st.status}
                          options={boardColumns}
                          onChange={(_newStatus, option) => {
                            updateSubtask.mutate({ subtaskId: st.id, updates: { columnId: option.id, status: option.id } });
                          }}
                          disabled={!canEditTask}
                          variant="pill"
                          size="sm"
                        />

                        {/* Convert Action (Absolute over row on hover) */}
                        {canEditTask && !issue.isArchived && (
                          <SubtaskActionMenu
                            onConvert={() => {
                              setSubtaskIdToConvert(st.id);
                              setSubtaskTitleToConvert(st.title);
                            }}
                            onDelete={() => setSubtaskToDelete({ id: st.id, title: st.title })}
                            disabled={convertToTask.isPending || deleteSubtask.isPending}
                          />
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Inline Add Subtask Input */}
            {isAdding && (
              <div className="border-t-2 border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)] p-2">
                <form onSubmit={handleAdd} className="flex items-center bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] overflow-hidden px-2 shadow-sm">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Name this subtask"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 py-1.5 text-[0.8125rem] outline-none text-[#111111] dark:text-[#E8E8E7] bg-transparent min-w-[200px]"
                    disabled={createSubtask.isPending}
                  />
                  <div className="flex items-center gap-2 pl-2 border-l border-[#EAEAEA] dark:border-white/[0.08]">
                    <div className="flex items-center gap-1 text-[0.75rem] text-[#ABABAB]">
                      <Layers className="w-3.5 h-3.5" />
                      Subtask
                    </div>
                    <button
                      type="submit"
                      disabled={!newTitle.trim() || createSubtask.isPending}
                      className="p-1 rounded bg-[#F0F0EE] dark:bg-[#2E2E2E] text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bottom Actions if not currently adding or if no tasks */}
            {!isAdding && canEditTask && !issue.isArchived && (
              <div className="p-2 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex items-center justify-between">
                 <button
                  onClick={() => setIsAdding(true)}
                  className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create subtask
                </button>
              </div>
            )}
            
            {isAdding && (
              <div className="p-2 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle("");
                  }}
                  className="text-[0.8125rem] font-medium text-[#787774] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:text-[#E8E8E7] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      <ConvertSubtaskConfirmModal
        isOpen={!!subtaskIdToConvert}
        onClose={() => setSubtaskIdToConvert(null)}
        onConfirm={() => {
          if (subtaskIdToConvert) {
            handleConvertToTask(subtaskIdToConvert);
          }
        }}
        subtaskTitle={subtaskTitleToConvert}
      />
      <DeleteSubtaskConfirmModal
        isOpen={!!subtaskToDelete}
        onClose={() => setSubtaskToDelete(null)}
        onConfirm={() => {
          if (subtaskToDelete) {
            handleDeleteSubtask(subtaskToDelete.id);
          }
        }}
        subtaskTitle={subtaskToDelete?.title ?? ""}
      />
    </div>
  );
}
