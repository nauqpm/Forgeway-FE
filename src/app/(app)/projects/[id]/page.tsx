"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { Plus, ArrowLeft, Settings, GripVertical } from "lucide-react";
import Link from "next/link";

interface Project { _id: string; name: string; key: string; type: string; description?: string; status: string; }
interface Board { _id: string; name: string; columns: { id: string; name: string; order: number }[]; }
interface Task { _id: string; key: string; title: string; type: string; priority: string; boardColumnId?: string; labels: string[]; }

const priorityColors: Record<string, string> = { highest: "border-l-red-500", high: "border-l-orange-400", medium: "border-l-yellow-400", low: "border-l-blue-400", lowest: "border-l-gray-300" };
const typeColors: Record<string, string> = { task: "bg-gray-400", bug: "bg-red-400", story: "bg-green-400", epic: "bg-purple-500" };

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { currentWorkspace } = useWorkspaceStore();
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [projRes, boardRes, taskRes] = await Promise.all([
        api.get(apiRoutes.PROJECTS.BY_ID(projectId)),
        api.get(`${apiRoutes.BOARDS.BASE}?projectId=${projectId}`),
        api.get(apiRoutes.TASKS.BY_PROJECT(projectId)),
      ]);
      setProject(projRes.data);
      if (boardRes.data.length > 0) {
        setBoard(boardRes.data[0]);
      } else {
        const newBoard = await api.post(apiRoutes.BOARDS.BASE, {
          projectId, name: "Board",
          columns: [
            { id: "todo", name: "To Do", order: 0 },
            { id: "inprogress", name: "In Progress", order: 1 },
            { id: "review", name: "In Review", order: 2 },
            { id: "done", name: "Done", order: 3 }
          ]
        });
        setBoard(newBoard.data);
      }
      setTasks(taskRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const getTasksByColumn = useCallback((columnId: string) => tasks.filter(t => t.boardColumnId === columnId), [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent, columnId: string) => { e.preventDefault(); setDragOverColumn(columnId); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.boardColumnId === columnId) { setDraggedTask(null); return; }
    setTasks(prev => prev.map(t => t._id === draggedTask._id ? { ...t, boardColumnId: columnId } : t));
    setDraggedTask(null);
    try { await api.put(apiRoutes.TASKS.MOVE(draggedTask._id), { boardId: board?._id, boardColumnId: columnId }); }
    catch { fetchData(); }
  };

  const handleCreateTask = async (columnId: string) => {
    if (!project) return;
    const title = prompt("Task title:");
    if (!title?.trim()) return;
    try {
      const res = await api.post(apiRoutes.TASKS.BASE, { title, projectId, boardId: board?._id, boardColumnId: columnId, type: "task", priority: "medium", status: columnId });
      setTasks(prev => [...prev, res.data]);
    } catch (e) { console.error(e); }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="p-6 text-center text-gray-500">Project not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">{project.key} · {project.type}</p>
          </div>
        </div>
        <button onClick={() => handleCreateTask("todo")} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full pb-4 min-w-max">
          {board?.columns.sort((a, b) => a.order - b.order).map((column) => {
            const columnTasks = getTasksByColumn(column.id);
            return (
              <div key={column.id} onDragOver={(e) => handleDragOver(e, column.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, column.id)}
                className={`w-72 flex-shrink-0 bg-gray-100 rounded-xl flex flex-col ${dragOverColumn === column.id ? "ring-2 ring-indigo-400" : ""}`}>
                <div className="flex items-center justify-between p-3">
                  <h3 className="font-semibold text-gray-800 text-sm">{column.name} <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">{columnTasks.length}</span></h3>
                  <button onClick={() => handleCreateTask(column.id)} className="p-1 hover:bg-gray-200 rounded"><Plus className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-2">
                  {columnTasks.map((task) => (
                    <div key={task._id} draggable onDragStart={(e) => handleDragStart(e, task)}
                      className={`group bg-white rounded-lg p-3 border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md ${priorityColors[task.priority] || "border-l-gray-300"}`}>
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{task.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded text-white ${typeColors[task.type]}`}>{task.type}</span>
                        {task.labels.slice(0, 2).map((label) => (<span key={label} className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">{label}</span>))}
                      </div>
                      <Link href={`/tasks/${task._id}`} className="block mt-2 text-xs text-indigo-600 hover:text-indigo-800">View details</Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
