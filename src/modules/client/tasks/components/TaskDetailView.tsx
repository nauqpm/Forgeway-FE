import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Tag,
  Flag,
  MessageSquare,
  Paperclip,
  Send,
  Edit3,
} from "lucide-react";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import StatusPicker from "@/shared/components/StatusPicker";
import { typeColors, priorityOptions } from "../types/taskDetail.type";
import type { TaskDetailPageProps } from "../hooks/useTaskDetailPage";

type Props = Omit<TaskDetailPageProps, "loading">;

export default function TaskDetailView({
  task,
  comments,
  newComment,
  setNewComment,
  submitting,
  editingDesc,
  setEditingDesc,
  descContent,
  setDescContent,
  handleAddComment,
  handleStatusChange,
  handleSaveDescription,
}: Props) {
  const { user } = useAuth();
  const { workspaces } = useCurrentWorkspace();

  if (!task)
    return (
      <div className="flex flex-col items-center justify-center min-h-[25rem] p-6 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)]">
          <AlertCircle className="h-5 w-5 text-[#9F2F2D] dark:text-[#F87171]" />
        </div>
        <p className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">Task not found</p>
        <p className="mt-1 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
          The task may have been deleted or is no longer available.
        </p>
      </div>
    );

  const priority = priorityOptions.find((p) => p.value === task.priority) || priorityOptions[2];
  const workspace = workspaces.find((w) => w._id === task.workspaceId) ?? null;
  const backHref = workspace ? `/workspaces/${workspace.key}` : "/workspaces";

  return (
    <div className="app-page-wide">
      <div className="flex items-start gap-4 mb-6">
        <Link href={backHref} className="mt-1 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded text-white ${typeColors[task.type] || "bg-gray-400"}`}>
              {task.type}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{task.key}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
          {workspace && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              in{" "}
              <Link href={`/workspaces/${workspace.key}`} className="text-indigo-600 hover:underline">
                {workspace.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Description</h2>
              {!editingDesc && (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-3">
                <textarea
                  value={descContent}
                  onChange={(e) => setDescContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={6}
                  placeholder="Add a description..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingDesc(false);
                      setDescContent(task.description || "");
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingDesc(true)}
                className="text-sm text-gray-700 dark:text-gray-300 min-h-15 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 -m-3"
                dangerouslySetInnerHTML={{
                  __html: task.description || '<p class="text-gray-400 italic">Click to add description...</p>',
                }}
              />
            )}
          </div>

          {/* Comments */}
          <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Comments ({comments.length})
            </h2>
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {comment.authorId?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.authorId?.fullName || "User"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString("en-US")}
                      </span>
                    </div>
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 prose prose-sm"
                      dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <StatusPicker
                  value={task.status}
                  onChange={(status) => handleStatusChange(status)}
                  variant="input"
                  options={["To Do", "In Progress", "Review", "Done"].map((name) => ({
                    id: name.toLowerCase().replace(/\s/g, ""),
                    name,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${priority.bg} ${priority.text}`}
                >
                  <Flag className="w-3.5 h-3.5" /> {priority.label}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Assignee
                </label>
                {task.assigneeId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                      {task.assigneeId.fullName?.charAt(0) || "?"}
                    </div>
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {task.assigneeId.fullName || task.assigneeId.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Reporter
                </label>
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {task.reporterId?.fullName || task.reporterId?.email || "—"}
                </span>
              </div>
              {task.dueDate && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <span
                    className={`text-sm ${
                      new Date(task.dueDate) < new Date() ? "text-red-600" : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {new Date(task.dueDate).toLocaleDateString("en-US")}
                  </span>
                </div>
              )}
              {task.storyPoints && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Story Points
                  </label>
                  <span className="text-sm text-gray-800 dark:text-gray-200">{task.storyPoints}</span>
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label) => (
                <span key={label} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                  {label}
                </span>
              ))}
              {task.labels.length === 0 && (
                <span className="text-sm text-gray-400 dark:text-gray-500">No labels</span>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Attachments
            </h3>
            {task.attachments?.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 truncate"
                  >
                    <Paperclip className="w-3.5 h-3.5 flex-shrink-0" /> {att.name}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No attachments</p>
            )}
          </div>

          {/* Activity */}
          <div className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Activity</h3>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <p>Created: {new Date(task.createdAt).toLocaleString("en-US")}</p>
              <p>Updated: {new Date(task.updatedAt).toLocaleString("en-US")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
