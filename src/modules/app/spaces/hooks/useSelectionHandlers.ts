import { Issue } from "../types/issue.type";

interface Props {
  issues: Issue[];

  selectedTaskIds: string[];

  setIssues: React.Dispatch<
    React.SetStateAction<Issue[]>
  >;

  setSelectedTaskIds: React.Dispatch<
    React.SetStateAction<string[]>
  >;
}

export const useSelectionHandlers = ({
  issues,
  selectedTaskIds,
  setIssues,
  setSelectedTaskIds,
}: Props) => {
  const toggleTaskSelection = (
    taskId: string,
    e?: React.ChangeEvent
  ) => {
    if (e) e.stopPropagation();

    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSprintSelection = (
    sprintTaskIds: string[],
    e?: React.ChangeEvent
  ) => {
    if (e) e.stopPropagation();

    const isAllSelected =
      sprintTaskIds.length > 0 &&
      sprintTaskIds.every((id) =>
        selectedTaskIds.includes(id)
      );

    if (isAllSelected) {
      setSelectedTaskIds((prev) =>
        prev.filter(
          (id) =>
            !sprintTaskIds.includes(id)
        )
      );
    } else {
      setSelectedTaskIds((prev) =>
        Array.from(
          new Set([
            ...prev,
            ...sprintTaskIds,
          ])
        )
      );
    }
  };

  const handleBulkStatusChange = (
    newStatus: string
  ) => {
    setIssues(
      issues.map((i) =>
        selectedTaskIds.includes(i.id)
          ? {
              ...i,
              status: newStatus,
            }
          : i
      )
    );

    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa ${selectedTaskIds.length} tasks đã chọn?`
      )
    ) {
      setIssues(
        issues.filter(
          (i) =>
            !selectedTaskIds.includes(i.id)
        )
      );

      setSelectedTaskIds([]);
    }
  };

  return {
    toggleTaskSelection,
    toggleSprintSelection,
    handleBulkStatusChange,
    handleBulkDelete,
  };
};