"use client";

import { useState, useCallback } from "react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { Board, Task } from "../types/projects.type";

interface UseProjectDetailActionsProps {
  projectId: string;
  board: Board | null;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  refetch: () => void;
}

interface UseProjectDetailActionsReturn {
  draggedTask: Task | null;
  dragOverColumn: string | null;
  handleDragStart: (e: React.DragEvent, task: Task) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, columnId: string) => Promise<void>;
  handleCreateTask: (columnId: string) => Promise<void>;
  getTasksByColumn: (columnId: string) => Task[];
}

export function useProjectDetailActions({
  projectId,
  board,
  tasks,
  setTasks,
  refetch,
}: UseProjectDetailActionsProps): UseProjectDetailActionsReturn {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getTasksByColumn = useCallback(
    (columnId: string) => tasks.filter((t) => t.boardColumnId === columnId),
    [tasks],
  );

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverColumn(null), []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      if (!draggedTask || draggedTask.boardColumnId === columnId) {
        setDraggedTask(null);
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t._id === draggedTask._id ? { ...t, boardColumnId: columnId } : t)),
      );
      setDraggedTask(null);
      try {
        await api.put(apiRoutes.TASKS.MOVE(draggedTask._id), {
          boardId: board?._id,
          boardColumnId: columnId,
        });
      } catch {
        refetch();
      }
    },
    [draggedTask, board, setTasks, refetch],
  );

  const handleCreateTask = useCallback(
    async (columnId: string) => {
      const title = prompt("Task title:");
      if (!title?.trim()) return;
      try {
        const res = await api.post(apiRoutes.TASKS.BASE, {
          title,
          projectId,
          boardId: board?._id,
          boardColumnId: columnId,
          type: "task",
          priority: "medium",
          status: columnId,
        });
        setTasks((prev) => [...prev, res.data]);
      } catch (e) {
        console.error(e);
      }
    },
    [projectId, board, setTasks],
  );

  return {
    draggedTask,
    dragOverColumn,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleCreateTask,
    getTasksByColumn,
  };
}
