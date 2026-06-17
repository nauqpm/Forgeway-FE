import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSprintDetailData } from "./useSprintDetailData";
import { useSprintDetailActions } from "./useSprintDetailActions";
import type { Sprint, SprintStats } from "../types/sprintDetail.type";

export interface UseSprintDetailPageResult {
  sprint: Sprint | null;
  stats: SprintStats | null;
  loading: boolean;
  actionLoading: boolean;
  handleStartSprint: () => Promise<void>;
  handleCompleteSprint: () => Promise<void>;
}

export function useSprintDetailPage(id: string): UseSprintDetailPageResult {
  const router = useRouter();
  const [sprintId, setSprintId] = useState<string | null>(null);

  // The original page eagerly redirects to /workspaces — preserve that behavior.
  useEffect(() => {
    router.replace("/workspaces");
  }, [router]);

  useEffect(() => {
    setSprintId(id);
  }, [id]);

  const { sprint, stats, loading, setSprint } = useSprintDetailData(sprintId);
  const { actionLoading, handleStartSprint, handleCompleteSprint } = useSprintDetailActions(
    sprintId,
    setSprint
  );

  return { sprint, stats, loading, actionLoading, handleStartSprint, handleCompleteSprint };
}
