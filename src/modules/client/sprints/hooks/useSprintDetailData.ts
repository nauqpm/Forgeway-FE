import { useEffect, useState } from "react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { Sprint, SprintStats } from "../types/sprintDetail.type";

export interface UseSprintDetailDataResult {
  sprint: Sprint | null;
  stats: SprintStats | null;
  loading: boolean;
  setSprint: (sprint: Sprint) => void;
}

export function useSprintDetailData(sprintId: string | null): UseSprintDetailDataResult {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [stats, setStats] = useState<SprintStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sprintId) return;

    const fetchData = async () => {
      try {
        const sprintRes = await api.get(apiRoutes.SPRINTS.BY_ID(sprintId));
        const nextSprint = sprintRes.data as Sprint;
        const sprintWorkspaceId =
          typeof nextSprint.workspaceId === "string"
            ? nextSprint.workspaceId
            : (nextSprint.workspaceId?._id ?? nextSprint.projectId._id);

        const tasksRes = await api.get(apiRoutes.TASKS.BY_SPRINT(sprintWorkspaceId, sprintId));
        setSprint(nextSprint);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tasks: any[] = tasksRes.data;
        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (t: any) => t.status === "done" || t.status === "completed"
          ).length,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalPoints: tasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0),
          completedPoints: tasks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((t: any) => t.status === "done" || t.status === "completed")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .reduce((sum: number, t: any) => sum + (t.storyPoints || 0), 0),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sprintId]);

  return { sprint, stats, loading, setSprint };
}
