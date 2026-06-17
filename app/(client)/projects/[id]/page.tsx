"use client";

import { useState, useCallback, useMemo } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/common/constants/queryKeys";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/shared/components/common/components/LoadingSpinner";
import { Plus, ArrowLeft, GripVertical } from "lucide-react";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  key: string;
  type: string;
  description?: string;
  status: string;
}
interface Board {
  _id: string;
  name: string;
  columns: { id: string; name: string; order: number }[];
}
interface Task {
  _id: string;
  key: string;
  title: string;
  type: string;
  priority: string;
  boardColumnId?: string;
  labels: string[];
}

const priorityColors: Record<string, string> = {
  highest: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-yellow-400",
  low: "border-l-blue-400",
  lowest: "border-l-gray-300",
};
const typeColors: Record<string, string> = {
  task: "bg-gray-400",
  bug: "bg-red-400",
  story: "bg-green-400",
  epic: "bg-purple-500",
};

export default function ProjectBoardPage() {
  usePageTitle("Project");
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: async () => {
      const res = await api.get(apiRoutes.PROJECTS.BY_ID(projectId));
      return res.data as Project;
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const { data: board, isLoading: isBoardLoading } = useQuery({
    queryKey: queryKeys.projects.board(projectId),
    queryFn: async () => {
      const boardRes = await api.get(`${apiRoutes.BOARDS.BASE}?projectId=${projectId}`);
      if (boardRes.data.length > 0) {
        return boardRes.data[0] as Board;
      } else {
        const newBoard = await api.post(apiRoutes.BOARDS.BASE, {
          projectId,
          name: "Board",
          columns: [
            { id: "todo", name: "To Do", order: 0 },
            { id: "inprogress", name: "In Progress", order: 1 },
            { id: "review", name: "In Review", order: 2 },
            { id: "done", name: "Done", order: 3 },
          ],
        });
        return newBoard.data as Board;
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: queryKeys.projects.tasks(projectId),
    queryFn: async () => {
      const res = await api.get(apiRoutes.TASKS.BY_PROJECT(projectId));
      return res.data as Task[];
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const tasks = useMemo(() => tasksData ?? [], [tasksData]);

  const getTasksByColumn = useCallback(
    (columnId: string) => tasks.filter((t) => t.boardColumnId === columnId),
    [tasks]
  );

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };
  const handleDragLeave = () => setDragOverColumn(null);

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string; columnId: string }) =>
      api.put(apiRoutes.TASKS.MOVE(taskId), { boardId: board?._id, boardColumnId: columnId }),
    onMutate: async ({ taskId, columnId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects.tasks(projectId) });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.projects.tasks(projectId));
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKeys.projects.tasks(projectId),
          previousTasks.map((t) => (t._id === taskId ? { ...t, boardColumnId: columnId } : t))
        );
      }
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.projects.tasks(projectId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
    },
  });

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.boardColumnId === columnId) {
      setDraggedTask(null);
      return;
    }
    const taskId = draggedTask._id;
    setDraggedTask(null);
    moveTaskMutation.mutate({ taskId, columnId });
  };

  const createTaskMutation = useMutation({
    mutationFn: ({ title, columnId }: { title: string; columnId: string }) =>
      api.post(apiRoutes.TASKS.BASE, {
        title,
        projectId,
        boardId: board?._id,
        boardColumnId: columnId,
        type: "task",
        priority: "medium",
        status: columnId,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData<Task[]>(queryKeys.projects.tasks(projectId), (current = []) => [
        ...current,
        res.data,
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.tasks(projectId) });
    },
  });

  const handleCreateTask = async (columnId: string) => {
    if (!project) return;
    const title = prompt("Task title:");
    if (!title?.trim()) return;
    createTaskMutation.mutate({ title, columnId });
  };

  const loading = isProjectLoading || isBoardLoading || isTasksLoading;

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="app-main text-center text-gray-500">Project not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-var(--app-header-h)-96px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project.key} · {project.type}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleCreateTask("todo")}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full pb-4 min-w-max">
          {board?.columns
            .sort((a, b) => a.order - b.order)
            .map((column) => {
              const columnTasks = getTasksByColumn(column.id);
              return (
                <div
                  key={column.id}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={`workspace-column flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col ${dragOverColumn === column.id ? "ring-2 ring-indigo-400" : ""}`}
                >
                  <div className="flex items-center justify-between p-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      {column.name}{" "}
                      <span className="ml-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                        {columnTasks.length}
                      </span>
                    </h3>
                    <button
                      onClick={() => handleCreateTask(column.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 space-y-2">
                    {columnTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className={`group bg-white dark:bg-gray-900 rounded-lg p-3 border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md ${priorityColors[task.priority] || "border-l-gray-300"}`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{task.key}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-1.5 py-0.5 text-xs rounded text-white ${typeColors[task.type]}`}>
                            {task.type}
                          </span>
                          {task.labels.slice(0, 2).map((label) => (
                            <span key={label} className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                              {label}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/tasks/${task._id}`}
                          className="block mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          View details
                        </Link>
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
