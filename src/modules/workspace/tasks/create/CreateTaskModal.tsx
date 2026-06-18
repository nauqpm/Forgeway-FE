"use client";

import { FileText, X } from "lucide-react";
import { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import StatusPicker from "@/shared/components/StatusPicker";
import TypePicker from "@/shared/components/TypePicker";
import PriorityPicker from "@/shared/components/PriorityPicker";
import AssigneePicker, { toAssigneePickerUsers, AssigneePickerMember } from "@/shared/components/AssigneePicker";
import { BoardColumn } from "@/modules/workspace/shared/types/board.type";

type CreateTaskModalProps = {
  showCreateIssue: boolean;
  setShowCreateIssue: (value: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newIssueForm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNewIssueForm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleCreateIssue: any;
  workspace: Workspace;
  boardColumns?: BoardColumn[];
};

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[0.8125rem] outline-none transition-colors";
const labelCls = "block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5";

export default function CreateTaskModal({
  showCreateIssue,
  setShowCreateIssue,
  newIssueForm,
  setNewIssueForm,
  handleCreateIssue,
  workspace,
  boardColumns = [],
}: CreateTaskModalProps) {
  if (!showCreateIssue) return null;

  const assigneeUsers = toAssigneePickerUsers(workspace.members as AssigneePickerMember[]);

  const statusOptions = boardColumns.length > 0 
    ? boardColumns.map(col => ({ id: col.id, name: col.name }))
    : ["To Do", "In Progress", "Done"].map(name => ({ id: name.toLowerCase().replace(/\s/g, ""), name }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100000] p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-lg border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            Create new task
          </h3>
          <button
            onClick={() => setShowCreateIssue(false)}
            className="text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => handleCreateIssue(e, newIssueForm)}
          className="p-5 space-y-4"
        >
          <div>
            <label className={labelCls}>
              Work item title <span className="text-[#9F2F2D]">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={newIssueForm.title}
              onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
              className={inputCls}
              placeholder="Example: Fix display issue on mobile..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Task type</label>
              <div className="mt-1">
                <TypePicker
                  value={newIssueForm.type ?? "Task"}
                  onChange={(type) => setNewIssueForm({ ...newIssueForm, type })}
                  variant="default"
                  size="md"
                  placement="bottom"
                  fullWidth
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Priority</label>
              <div className="mt-1">
                <PriorityPicker
                  value={newIssueForm.priority ?? "Medium"}
                  onChange={(priority) => setNewIssueForm({ ...newIssueForm, priority })}
                  variant="default"
                  size="md"
                  placement="bottom"
                  fullWidth
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Initial status</label>
            <StatusPicker
              value={newIssueForm.status}
              columnId={newIssueForm.columnId}
              options={statusOptions}
              variant="input"
              onChange={(status, option) => setNewIssueForm({ ...newIssueForm, status, columnId: option.id })}
            />
          </div>

          <div>
            <label className={labelCls}>Assignee</label>
            <div className="mt-1 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] px-2 py-[5px]">
              <AssigneePicker
                users={assigneeUsers}
                value={newIssueForm.assigneeId ?? null}
                onChange={(userId) => setNewIssueForm({ ...newIssueForm, assigneeId: userId })}
                placement="bottom"
                size="md"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowCreateIssue(false)}
              className="px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
            >
              Create now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
