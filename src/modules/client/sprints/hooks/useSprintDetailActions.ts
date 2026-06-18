import { useState } from "react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { Sprint } from "../types/sprintDetail.type";

export interface UseSprintDetailActionsResult {
  actionLoading: boolean;
  handleStartSprint: () => Promise<void>;
  handleCompleteSprint: () => Promise<void>;
}

export function useSprintDetailActions(
  sprintId: string | null,
  setSprint: (sprint: Sprint) => void
): UseSprintDetailActionsResult {
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartSprint = async () => {
    if (!sprintId) return;
    setActionLoading(true);
    try {
      const res = await api.put(apiRoutes.SPRINTS.START(sprintId));
      setSprint(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSprint = async () => {
    if (!sprintId) return;
    setActionLoading(true);
    try {
      const res = await api.put(apiRoutes.SPRINTS.COMPLETE(sprintId));
      setSprint(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  return { actionLoading, handleStartSprint, handleCompleteSprint };
}
