"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft, User, Tag, Calendar, Flag, MessageSquare, Paperclip, Send, Edit3 } from "lucide-react";

interface Task {
  _id: string; key: string; title: string; description?: string; type: string;
  status: string; priority: string; assigneeId?: any; reporterId?: any;
  labels: string[]; dueDate?: string; projectId?: any; storyPoints?: number;
  attachments: any[]; createdAt: string; updatedAt: string;
}
interface Comment { _id: string; content: string; authorId: any; createdAt: string; }

const typeColors: Record<string, string> = { task: "bg-gray-500", bug: "bg-red-500", story: "bg-green-500", epic: "bg-purple-500" };
const priorityOptions = [
  { value: "highest", label: "Highest", bg: "bg-red-100", text: "text-red-700" },
  { value: "high", label: "High", bg: "bg-orange-100", text: "text-orange-700" },
  { value: "medium", label: "Medium", bg: "bg-yellow-100", text: "text-yellow-700" },
  { value: "low", label: "Low", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "lowest", label: "Lowest", bg: "bg-gray-100", text: "text-gray-700" },
];

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descContent, setDescContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTask = async () => {
    try {
      const res = await api.get(apiRoutes.TASKS.BY_ID(taskId));
      setTask(res.data);
      setDescContent(res.data.description || "");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchComments = async () => {
    if (!task) return;
    try {
      const res = await api.get(apiRoutes.COMMENTS.BY_TARGET("task", taskId));
      setComments(res.data);
    } catch {}
  };

  useEffect(() => { fetchTask(); }, [taskId]);
  useEffect(() => { fetchComments(); }, [task]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    setSubmitting(true);
    try {
      const res = await api.post(apiRoutes.COMMENTS.BASE, { content: newComment, targetType: "task", targetId: taskId });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (status: string) => {
    if (!task) return;
    try {
      await api.put(apiRoutes.TASKS.STATUS(taskId), { status });
      setTask({ ...task, status });
    } catch (e) { console.error(e); }
  };

  const handleSaveDescription = async () => {
    if (!task) return;
    try {
      await api.put(apiRoutes.TASKS.BY_ID(taskId), { description: descContent });
      setTask({ ...task, description: descContent });
      setEditingDesc(false);
    } catch (e) { console.error(e); }
  };

  if (loading) return <LoadingSpinner />;
  if (!task) return <div className="p-6 text-center text-gray-500">Task not found</div>;

  const priority = priorityOptions.find(p => p.value === task.priority) || priorityOptions[2];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start gap-4 mb-6">
        <Link href="/projects" className="mt-1 p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded text-white ${typeColors[task.type] || "bg-gray-400"}`}>{task.type}</span>
            <span className="text-sm text-gray-500">{task.key}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          {task.projectId?.name && <p className="text-sm text-gray-500 mt-1">in <Link href={`/projects/${task.projectId._id}`} className="text-indigo-600 hover:underline">{task.projectId.name}</Link></p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Description</h2>
              {!editingDesc && <button onClick={() => setEditingDesc(true)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>}
            </div>
            {editingDesc ? (
              <div className="space-y-3">
                <textarea value={descContent} onChange={(e) => setDescContent(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" rows={6} placeholder="Add a description..." />
                <div className="flex gap-2">
                  <button onClick={handleSaveDescription} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Save</button>
                  <button onClick={() => { setEditingDesc(false); setDescContent(task.description || ""); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditingDesc(true)} className="text-sm text-gray-700 min-h-[60px] cursor-pointer hover:bg-gray-50 rounded-lg p-3 -m-3" dangerouslySetInnerHTML={{ __html: task.description || '<p class="text-gray-400 italic">Click to add description...</p>' }} />
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Comments ({comments.length})</h2>
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {comment.authorId?.fullName?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{comment.authorId?.fullName || "User"}</span>
                      <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 prose prose-sm" dangerouslySetInnerHTML={{ __html: comment.content }} />
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>}
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div className="flex-1">
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm" rows={3} />
                <div className="flex justify-end mt-2">
                  <button onClick={handleAddComment} disabled={submitting || !newComment.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                    <Send className="w-4 h-4" /> Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select value={task.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                  {["todo", "inprogress", "review", "done"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Priority</label>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${priority.bg} ${priority.text}`}>
                  <Flag className="w-3.5 h-3.5" /> {priority.label}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assignee</label>
                {task.assigneeId ? (
                  <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{task.assigneeId.fullName?.charAt(0) || "?"}</div><span className="text-sm text-gray-800">{task.assigneeId.fullName || task.assigneeId.email}</span></div>
                ) : <span className="text-sm text-gray-400">Unassigned</span>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Reporter</label>
                <span className="text-sm text-gray-800">{task.reporterId?.fullName || task.reporterId?.email || "—"}</span>
              </div>
              {task.dueDate && <div><label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Due Date</label><span className={`text-sm ${new Date(task.dueDate) < new Date() ? "text-red-600" : "text-gray-800"}`}>{new Date(task.dueDate).toLocaleDateString("vi-VN")}</span></div>}
              {task.storyPoints && <div><label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Story Points</label><span className="text-sm text-gray-800">{task.storyPoints}</span></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Labels</h3>
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label) => <span key={label} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">{label}</span>)}
              {task.labels.length === 0 && <span className="text-sm text-gray-400">No labels</span>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attachments</h3>
            {task.attachments?.length > 0 ? (
              <div className="space-y-2">
                {task.attachments.map((att) => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm text-gray-700 truncate">
                    <Paperclip className="w-3.5 h-3.5 flex-shrink-0" /> {att.name}
                  </a>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No attachments</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Activity</h3>
            <div className="space-y-1 text-xs text-gray-500">
              <p>Created: {new Date(task.createdAt).toLocaleString("vi-VN")}</p>
              <p>Updated: {new Date(task.updatedAt).toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
