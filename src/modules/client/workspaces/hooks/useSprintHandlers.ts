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
  workspaceKey: string;
  sprints: Sprint[];
  editingSprint: Sprint | null;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  setEditingSprint: React.Dispatch<React.SetStateAction<Sprint | null>>;
  setIsSprintModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
}

export const useSprintHandlers = ({
  workspaceKey,
  sprints,
  editingSprint,
  setSprints,
  setEditingSprint,
  setIsSprintModalOpen,
  setIssues,
}: UseSprintHandlersProps) => {
  const queryClient = useQueryClient();
  const [startSprintTarget, setStartSprintTarget] = useState<Sprint | null>(null);
  const [completeSprintTarget, setCompleteSprintTarget] = useState<Sprint | null>(null);

  const createSprintMutation = useMutation({
    mutationFn: (input: CreateSprintInput) =>
      sprintService.createSprint(workspaceKey, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceKey] });
      const previousSprints = sprints;
      const tempId = `temp-${Date.now()}`;
      const tempSprint: Sprint = {
        _id: tempId,
        id: tempId,
        workspaceId: workspaceKey,
        name: input.name,
        goal: input.goal,
        status: "planning",
        startDate: input.startDate,
        endDate: input.endDate,
        duration: input.duration,
      };
      setSprints([...sprints, tempSprint]);
      return { previousSprints };
    },
    onError: (err, _input, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Lỗi khi tạo sprint mới"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceKey] });
    },
    onSuccess: () => {
      toast.success("Đã tạo sprint mới");
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: UpdateSprintInput }) =>
      sprintService.updateSprint(workspaceKey, sprintId, input),
    onMutate: async ({ sprintId, input }) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceKey] });
      const previousSprints = sprints;
      setSprints(sprints.map((s) => (s._id === sprintId ? { ...s, ...input } : s)));
      return { previousSprints };
    },
    onError: (err, _vars, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Lỗi khi cập nhật sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceKey] });
    },
    onSuccess: () => {
      toast.success("Đã cập nhật sprint");
    },
  });

  const deleteSprintMutation = useMutation({
    mutationFn: (sprintId: string) =>
      sprintService.deleteSprint(workspaceKey, sprintId),
    onMutate: async (sprintId) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceKey] });
      const previousSprints = sprints;
      setSprints(sprints.filter((s) => s._id !== sprintId));
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Lỗi khi xóa sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceKey] });
    },
    onSuccess: () => {
      toast.success("Đã xóa sprint");
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input: { startDate: string; endDate: string } }) =>
      sprintService.startSprint(workspaceKey, sprintId, input),
    onMutate: async ({ sprintId }) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceKey] });
      const previousSprints = sprints;
      setSprints(sprints.map((s) => (s._id === sprintId ? { ...s, status: "active" as const } : s)));
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Lỗi khi bắt đầu sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceKey] });
      queryClient.invalidateQueries({ queryKey: ["board", workspaceKey] });
    },
    onSuccess: () => {
      toast.success("Sprint đã bắt đầu");
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: ({ sprintId, input }: { sprintId: string; input?: { moveToSprintId?: string } }) =>
      sprintService.completeSprint(workspaceKey, sprintId, input),
    onMutate: async ({ sprintId }) => {
      await queryClient.cancelQueries({ queryKey: ["sprints", workspaceKey] });
      const previousSprints = sprints;
      setSprints(sprints.map((s) => (s._id === sprintId ? { ...s, status: "completed" as const } : s)));
      return { previousSprints };
    },
    onError: (err, _id, context) => {
      if (context?.previousSprints) setSprints(context.previousSprints);
      toast.error(getApiErrorMessage(err, "Lỗi khi hoàn thành sprint"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceKey] });
      queryClient.invalidateQueries({ queryKey: ["board", workspaceKey] });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceKey] });
    },
    onSuccess: () => {
      toast.success("Sprint đã hoàn thành");
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
      toast.error("Sprint đã hoàn thành nên không thể chỉnh sửa");
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
      toast.error("Không tìm thấy sprint");
      return;
    }
    if (sprint._id.startsWith("temp-")) {
      toast.error("Sprint đang được tạo, vui lòng đợi đồng bộ");
      return;
    }
    if (sprint.status !== "planning") {
      toast.error("Chỉ sprint đang lên kế hoạch mới có thể bắt đầu");
      return;
    }
    if (!sprint.startDate || !sprint.endDate) {
      setStartSprintTarget(sprint);
      return;
    }
    if (new Date(sprint.endDate) <= new Date(sprint.startDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
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
      toast.error("Không tìm thấy sprint");
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
