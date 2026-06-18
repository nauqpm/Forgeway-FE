"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { ProjectDetail, Board, Task } from "../types/projects.type";

interface UseProjectDetailDataReturn {
  project: ProjectDetail | null;
  board: Board | null;
  tasks: Task[];
  loading: boolean;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  refetch: () => void;
}

export function useProjectDetailData(projectId: string): UseProjectDetailDataReturn {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
          projectId,
          name: "Board",
          columns: [
            { id: "todo", name: "To Do", order: 0 },
            { id: "inprogress", name: "In Progress", order: 1 },
            { id: "review", name: "In Review", order: 2 },
            { id: "done", name: "Done", order: 3 },
          ],
        });
        setBoard(newBoard.data);
      }
      setTasks(taskRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { project, board, tasks, loading, setTasks, refetch: fetchData };
}
