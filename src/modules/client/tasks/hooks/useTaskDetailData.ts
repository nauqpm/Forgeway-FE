import { useState, useEffect } from "react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { TaskDetailItem, TaskDetailComment } from "../types/taskDetail.type";

export interface UseTaskDetailDataReturn {
  task: TaskDetailItem | null;
  comments: TaskDetailComment[];
  loading: boolean;
  setTask: React.Dispatch<React.SetStateAction<TaskDetailItem | null>>;
  setComments: React.Dispatch<React.SetStateAction<TaskDetailComment[]>>;
  refetchComments: () => Promise<void>;
}

export function useTaskDetailData(taskId: string): UseTaskDetailDataReturn {
  const [task, setTask] = useState<TaskDetailItem | null>(null);
  const [comments, setComments] = useState<TaskDetailComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    try {
      const res = await api.get(apiRoutes.TASKS.BY_ID(taskId));
      setTask(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!task) return;
    try {
      const res = await api.get(apiRoutes.COMMENTS.BY_TARGET("task", taskId));
      setComments(res.data);
    } catch {
      // silently ignore comment fetch errors
    }
  };

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  return {
    task,
    comments,
    loading,
    setTask,
    setComments,
    refetchComments: fetchComments,
  };
}
