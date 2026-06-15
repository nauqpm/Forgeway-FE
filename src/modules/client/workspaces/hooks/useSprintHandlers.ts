import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sprintService } from "../services/sprintService";
import { Sprint, CreateSprintInput, UpdateSprintInput } from "../types/sprint.type";
import { Issue } from "../types/issue.type";
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
  sprints: Sprint[];
  editingSprint: Sprint | null;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  setEditingSprint: React.Dispatch<React.SetStateAction<Sprint | null>>;
  setIsSprintModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
}

export const useSprintHandlers = ({
  workspaceId,
  sprints,
  editingSprint,
  setSprints,
  setEditingSprint,
  setIsSprintModalOpen,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setIssues: _setIssues,
}: UseSprintHandlersProps) => {
  const queryClient = useQueryClient();
  const [startSprintTarget, setStartSprintTarget] = useState<Sprint | null>(null);
  const [completeSprintTarget, setCompleteSprintTarget] = useState<Sprint | null>(null);

  const createSprintMutation = useMutation({
    mutationFn: (input: CreateSprintInput) =>
      sprintService.createSprint(workspaceId, input),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceId] });
      return { previousSprints: sprints };
    },
    onSuccess: (newSprint) => {
      setSprints((prev) => [...prev, newSprint]);
      toast.success("Sprint created");
    },
    onError: (err, _input, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Error creating sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId] });
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: UpdateSprintInput }) =>
      sprintService.updateSprint(workspaceId, sprintId, input),
    onMutate: async ({ sprintId, input }) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceId] });
      const previousSprints = sprints;
      setSprints(sprints.map((s) => (s._id === sprintId ? { ...s, ...input } : s)));
      return { previousSprints };
    },
    onError: (err, _vars, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Error updating sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId] });
    },
    onSuccess: () => {
      toast.success("Sprint updated");
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) =>
      sprintService.deleteSprint(workspaceId, sprintId),
    onMutate: async (sprintId) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceId] });
      const previousSprints = sprints;
      setSprints(sprints.filter((s) => s._id !== sprintId));
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Error deleting sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId] });
    },
    onSuccess: () => {
      toast.success("Sprint deleted");
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: { startDate: string; endDate: string } }) =>
      sprintService.startSprint(workspaceId, sprintId, input),
    onMutate: async ({ sprintId }) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceId] });
      const previousSprints = sprints;
      setSprints(sprints.map((s) => (s._id === sprintId ? { ...s, status: "active" as const } : s)));
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Error starting sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["board", workspaceId] });
    },
    onSuccess: () => {
      toast.success("Sprint started");
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input?: { moveToSprintId?: string } }) =>
      sprintService.completeSprint(workspaceId, sprintId, input),
    onMutate: async ({ sprintId }) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceId] });
      const previousSprints = sprints;
      setSprints(sprints.map((s) => (s._id === sprintId ? { ...s, status: "completed" as const } : s)));
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Error completing sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["board", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
