import { Issue } from "../types/issue.type";
import { taskService } from "../services/taskService";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";

interface Props {
  workspaceId: string;
  issues: Issue[];
  selectedTaskIds: string[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useSelectionHandlers = ({
  workspaceId,
  issues,
  selectedTaskIds,
  setIssues,
  setSelectedTaskIds,
}: Props) => {
  const queryClient = useQueryClient();

  const toggleTaskSelection = (taskId: string, e?: React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSprintSelection = (sprintTaskIds: string[], e?: React.ChangeEvent) => {
    if (e) e.stopPropagation();
    const isAllSelected =
      sprintTaskIds.length > 0 &&
      sprintTaskIds.every((id) => selectedTaskIds.includes(id));
    if (isAllSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !sprintTaskIds.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...sprintTaskIds])));
    }
  };

  const handleBulkStatusChange = (newStatus: string) => {
    setIssues(issues.map((i) => selectedTaskIds.includes(i.id) ? { ...i, status: newStatus } : i));
    selectedTaskIds.forEach((taskId) => {
      taskService
        .updateBoardTask(workspaceId, taskId, { status: newStatus } as Partial<Issue>)
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() }))
        .catch(console.error);
    });
    setSelectedTaskIds([]);
  };

  const handleBulkMoveSprint = (sprintId: string | null) => {
    setIssues(issues.map((i) => selectedTaskIds.includes(i.id) ? { ...i, sprintId } : i));
    selectedTaskIds.forEach((taskId) => {
      taskService
        .updateBoardTask(workspaceId, taskId, { sprintId } as Partial<Issue>)
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() }))
        .catch(console.error);
    });
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    const ids = [...selectedTaskIds];
    setIssues(issues.filter((i) => !ids.includes(i.id)));
    setSelectedTaskIds([]);
    ids.forEach((taskId) => {
      taskService
        .deleteBoardTask(workspaceId, taskId)
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() }))
        .catch(console.error);
    });
  };

  return {
    toggleTaskSelection,
    toggleSprintSelection,
    handleBulkStatusChange,
    handleBulkMoveSprint,
    handleBulkDelete,
  };
};
