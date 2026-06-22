import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { sprintService } from "../services/sprintService";
import { Sprint, CreateSprintInput, UpdateSprintInput } from "../types/sprint.type";
import { toast } from "react-hot-toast";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const message = err?.response?.data?.message;
  if (Array.isArray(message) && message.length > 0) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
};

interface UseSprintHandlersProps {
  workspaceId: string;
  enabled: boolean;
  editingSprint: Sprint | null;
  setEditingSprint: React.Dispatch<React.SetStateAction<Sprint | null>>;
  setIsSprintModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSprintHandlers = ({
  workspaceId,
  enabled,
  editingSprint,
  setEditingSprint,
  setIsSprintModalOpen,
}: UseSprintHandlersProps) => {
  const queryClient = useQueryClient();
  const [startSprintTarget, setStartSprintTarget] = useState<Sprint | null>(null);
  const [completeSprintTarget, setCompleteSprintTarget] = useState<Sprint | null>(null);

  const { data: sprints = [] } = useQuery<Sprint[]>({
    queryKey: queryKeys.sprints.byWorkspace(workspaceId),
    queryFn: () => sprintService.listSprints(workspaceId),
    enabled: enabled && !!workspaceId,
    staleTime: 30_000,
  });

  const createSprintMutation = useMutation({
    mutationFn: (input: CreateSprintInput) =>
      sprintService.createSprint(workspaceId, input),
    onMutate: async (newSprintInput) => {
      const queryKey = queryKeys.sprints.byWorkspace(workspaceId);
      await queryClient.cancelQueries({ queryKey });
      const previousSprints = queryClient.getQueryData<Sprint[]>(queryKey) || [];
      const optimisticSprint: Sprint = {
        _id: "temp-" + Date.now(),
        id: "temp-" + Date.now(),
        name: newSprintInput.name,
        status: "planning",
        startDate: newSprintInput.startDate,
        endDate: newSprintInput.endDate,
        goal: newSprintInput.goal,
        workspaceId,
      };
      queryClient.setQueryData(queryKey, [...previousSprints, optimisticSprint]);
      return { previousSprints };
    },
    onSuccess: () => {
      toast.success("Sprint created");
    },
    onError: (err, _input, context) => {
      if (context?.previousSprints) {
        queryClient.setQueryData(queryKeys.sprints.byWorkspace(workspaceId), context.previousSprints);
      }
      toast.error(getApiErrorMessage(err, "Error creating sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byWorkspace(workspaceId) });
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: UpdateSprintInput }) =>
      sprintService.updateSprint(workspaceId, sprintId, input),
    onMutate: async ({ sprintId, input }) => {
      const queryKey = queryKeys.sprints.byWorkspace(workspaceId);
      await queryClient.cancelQueries({ queryKey });
      const previousSprints = queryClient.getQueryData<Sprint[]>(queryKey) || [];
      queryClient.setQueryData(
        queryKey,
        previousSprints.map((s) => (s._id === sprintId ? { ...s, ...input } : s))
      );
      return { previousSprints };
    },
    onError: (err, _vars, context) => {
      if (context?.previousSprints) {
        queryClient.setQueryData(queryKeys.sprints.byWorkspace(workspaceId), context.previousSprints);
      }
      toast.error(getApiErrorMessage(err, "Error updating sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byWorkspace(workspaceId) });
    },
    onSuccess: () => {
      toast.success("Sprint updated");
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) =>
      sprintService.deleteSprint(workspaceId, sprintId),
    onMutate: async (sprintId) => {
      const queryKey = queryKeys.sprints.byWorkspace(workspaceId);
      await queryClient.cancelQueries({ queryKey });
      const previousSprints = queryClient.getQueryData<Sprint[]>(queryKey) || [];
      queryClient.setQueryData(
        queryKey,
        previousSprints.filter((s) => s._id !== sprintId)
      );
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) {
        queryClient.setQueryData(queryKeys.sprints.byWorkspace(workspaceId), context.previousSprints);
      }
      toast.error(getApiErrorMessage(err, "Error deleting sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byWorkspace(workspaceId) });
    },
    onSuccess: () => {
      toast.success("Sprint deleted");
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: { startDate: string; endDate: string } }) =>
      sprintService.startSprint(workspaceId, sprintId, input),
    onMutate: async ({ sprintId }) => {
      const queryKey = queryKeys.sprints.byWorkspace(workspaceId);
      await queryClient.cancelQueries({ queryKey });
      const previousSprints = queryClient.getQueryData<Sprint[]>(queryKey) || [];
      queryClient.setQueryData(
        queryKey,
        previousSprints.map((s) => (s._id === sprintId ? { ...s, status: "active" as const } : s))
      );
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) {
        queryClient.setQueryData(queryKeys.sprints.byWorkspace(workspaceId), context.previousSprints);
      }
      toast.error(getApiErrorMessage(err, "Error starting sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byWorkspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board.byWorkspace(workspaceId) });
    },
    onSuccess: () => {
      toast.success("Sprint started");
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input?: { moveToSprintId?: string } }) =>
      sprintService.completeSprint(workspaceId, sprintId, input),
    onMutate: async ({ sprintId }) => {
      const queryKey = queryKeys.sprints.byWorkspace(workspaceId);
      await queryClient.cancelQueries({ queryKey });
      const previousSprints = queryClient.getQueryData<Sprint[]>(queryKey) || [];
      queryClient.setQueryData(
        queryKey,
        previousSprints.map((s) => (s._id === sprintId ? { ...s, status: "completed" as const } : s))
      );
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) {
        queryClient.setQueryData(queryKeys.sprints.byWorkspace(workspaceId), context.previousSprints);
      }
      toast.error(getApiErrorMessage(err, "Error completing sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byWorkspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.board.byWorkspace(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
    onSuccess: () => {
      toast.success("Sprint completed");
    },
  });

  const handleCreateSprint = () => {
    setEditingSprint(null);
    setIsSprintModalOpen(true);
  };

  const handleSaveSprint = (data: CreateSprintInput | UpdateSprintInput) => {
    if (editingSprint) {
      updateSprintMutation.mutate({ sprintId: editingSprint._id, input: data as UpdateSprintInput });
    } else {
      createSprintMutation.mutate(data as CreateSprintInput);
    }
    setIsSprintModalOpen(false);
    setEditingSprint(null);
  };

  const handleEditSprint = (sprint: Sprint) => {
    if (sprint.status === "completed") {
      toast.error("Completed sprints cannot be edited");
      return;
    }
    setEditingSprint(sprint);
    setIsSprintModalOpen(true);
  };

  const handleDeleteSprint = (sprintId: string) => {
    deleteSprintMutation.mutate(sprintId);
  };

  const handleStartSprint = (sprintId: string) => {
    const sprint = sprints.find((s) => s._id === sprintId);
    if (!sprint) {
      toast.error("No sprint");
      return;
    }
    if (sprint._id.startsWith("temp-")) {
      toast.error("Sprint is being created. Please wait for sync");
      return;
    }
    if (sprint.status !== "planning") {
      toast.error("Only planned sprints can be started");
      return;
    }
    if (!sprint.startDate || !sprint.endDate) {
      setStartSprintTarget(sprint);
      return;
    }
    if (new Date(sprint.endDate) <= new Date(sprint.startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    startSprintMutation.mutate({
      sprintId,
      input: {
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },
    });
  };

  const handleConfirmStartSprint = (startDate: string, endDate: string) => {
    if (!startSprintTarget) return;
    startSprintMutation.mutate({
      sprintId: startSprintTarget._id,
      input: {
        startDate,
        endDate,
      },
    });
    setStartSprintTarget(null);
  };

  const handleCompleteSprint = (sprintId: string) => {
    const sprint = sprints.find((s) => s._id === sprintId);
    if (!sprint) {
      toast.error("No sprint");
      return;
    }
    setCompleteSprintTarget(sprint);
  };

  const handleConfirmCompleteSprint = (moveToSprintId?: string) => {
    if (!completeSprintTarget) return;
    completeSprintMutation.mutate({
      sprintId: completeSprintTarget._id,
      input: { moveToSprintId },
    });
    setCompleteSprintTarget(null);
  };

  return {
    sprints,
    handleCreateSprint,
    handleSaveSprint,
    handleEditSprint,
    handleDeleteSprint,
    handleStartSprint,
    handleConfirmStartSprint,
    handleCompleteSprint,
    handleConfirmCompleteSprint,
    startSprintTarget,
    setStartSprintTarget,
    completeSprintTarget,
    setCompleteSprintTarget,
    isStarting: startSprintMutation.isPending,
    isCompleting: completeSprintMutation.isPending,
  };
};
