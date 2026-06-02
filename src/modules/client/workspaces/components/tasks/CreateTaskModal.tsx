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
    <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Create new task
          </h3>

          <button
            onClick={() => setShowCreateIssue(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => handleCreateIssue(e, newIssueForm)}
          className="p-6 space-y-5 bg-gray-50/30 dark:bg-gray-900"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Work item title <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              autoFocus
              required
              value={newIssueForm.title}
              onChange={(e) =>
                setNewIssueForm({
                  ...newIssueForm,
                  title: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-all"
              placeholder="Example: Fix display issue on mobile..."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Task type
              </label>

              <select
                value={newIssueForm.type}
                onChange={(e) =>
                  setNewIssueForm({
                    ...newIssueForm,
                    type: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
              >
                <option value="Task">📌 Task</option>
                <option value="Bug">🐛 Bug</option>
                <option value="Story">📖 Story</option>
                <option value="Epic">Epic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Priority
              </label>

              <select
                value={newIssueForm.priority}
                onChange={(e) =>
                  setNewIssueForm({
                    ...newIssueForm,
                    priority: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟠 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Initial status
            </label>

            <select
              value={newIssueForm.status}
              onChange={(e) =>
                setNewIssueForm({
                  ...newIssueForm,
                  status: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="To Do">⭕ To Do</option>
              <option value="In Progress">⏳ In Progress</option>
              <option value="Done">✅ Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assignee
            </label>

            <select
              value={newIssueForm.assigneeId ?? ""}
              onChange={(e) =>
                setNewIssueForm({
                  ...newIssueForm,
                  assigneeId: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Unassigned</option>
              {workspaceMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowCreateIssue(false)}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Create now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
