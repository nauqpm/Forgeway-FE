"use client";

import { FileText, X } from "lucide-react";
import { Workspace } from "../../types/workspace.type";

type CreateTaskModalProps = {
  showCreateIssue: boolean;
  setShowCreateIssue: (value: boolean) => void;
  newIssueForm: any;
  setNewIssueForm: any;
  handleCreateIssue: any;
  workspace: Workspace;
};

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[13px] outline-none transition-colors";
const labelCls = "block text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5";

export default function CreateTaskModal({
  showCreateIssue,
  setShowCreateIssue,
  newIssueForm,
  setNewIssueForm,
  handleCreateIssue,
  workspace,
}: CreateTaskModalProps) {
  if (!showCreateIssue) return null;

  const workspaceMembers = (workspace.members ?? [])
    .map((member) => {
      const user = member.userId;
      const id = typeof user === "string" ? user : user._id ?? user.id ?? "";
      const name = typeof user === "string" ? user : user.fullName || user.name || user.email || id;
      const email = typeof user === "string" ? "" : user.email ?? "";

      return {
        id,
        label: email && email !== name ? `${name} (${email})` : name || "Member",
      };
    })
    .filter((member) => member.id);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-[#202020] rounded-[10px] w-full max-w-lg border border-[#EAEAEA] dark:border-white/8 overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EAEAEA] dark:border-white/8">
          <h3 className="text-[15px] font-semibold text-[#111111] dark:text-[#E8E8E7] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            Create new task
          </h3>
          <button
            onClick={() => setShowCreateIssue(false)}
            className="text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
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
              <select
                value={newIssueForm.type}
                onChange={(e) => setNewIssueForm({ ...newIssueForm, type: e.target.value })}
                className={inputCls}
              >
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
                <option value="Story">Story</option>
                <option value="Epic">Epic</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={newIssueForm.priority}
                onChange={(e) => setNewIssueForm({ ...newIssueForm, priority: e.target.value })}
                className={inputCls}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Initial status</label>
            <select
              value={newIssueForm.status}
              onChange={(e) => setNewIssueForm({ ...newIssueForm, status: e.target.value })}
              className={inputCls}
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Assignee</label>
            <select
              value={newIssueForm.assigneeId ?? ""}
              onChange={(e) => setNewIssueForm({ ...newIssueForm, assigneeId: e.target.value })}
              className={inputCls}
            >
              <option value="">Unassigned</option>
              {workspaceMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowCreateIssue(false)}
              className="px-4 py-2 border border-[#EAEAEA] dark:border-white/10 text-[#111111] dark:text-[#E8E8E7] rounded-[6px] text-[13px] font-medium hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
            >
              Create now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
