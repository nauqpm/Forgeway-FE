"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Task } from "../types/myTasks.type";

interface UseMyTasksDataReturn {
  tasks: Task[];
  loading: boolean;
  refetch: () => void;
}

export function useMyTasksData(): UseMyTasksDataReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await api.get(apiRoutes.TASKS.ASSIGNEE(user.id));
        if (!cancelled) setTasks(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTasks();
    return () => {
      cancelled = true;
    };
  }, [user?.id, tick]);

  const refetch = () => setTick((t) => t + 1);

  return { tasks, loading, refetch };
}
