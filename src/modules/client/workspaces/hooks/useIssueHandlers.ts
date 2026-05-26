import { useQueryClient } from "@tanstack/react-query";
import { Issue } from "../types/issue.type";
import { taskService } from "../services/taskService";
import { toast } from "react-hot-toast";

interface CreateIssueForm {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
}

interface UseIssueHandlersProps {
  workspaceKey: string;

  issues: Issue[];

  setIssues: React.Dispatch<
    React.SetStateAction<Issue[]>
  >;

  setShowCreateIssue: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  setNewIssueForm: React.Dispatch<
    React.SetStateAction<CreateIssueForm>
  >;

  setSelectedIssue: React.Dispatch<
    React.SetStateAction<Issue | null>
  >;
}

export const useIssueHandlers = ({
  workspaceKey,
  issues,
  setIssues,
  setShowCreateIssue,
  setNewIssueForm,
  setSelectedIssue,
}: UseIssueHandlersProps) => {
  const queryClient = useQueryClient();
  const getTaskKey = (id: string) => issues.find((issue) => issue.id === id)?.key;

  const updateIssueDirectly = (
    id: string,
    updates: Partial<Issue>
  ) => {
    const taskKey = getTaskKey(id);
    if (!taskKey) {
      toast.error("Khong tim thay task key");
      return;
    }

    setIssues(
      issues.map((i) =>
        i.id === id
          ? { ...i, ...updates }
          : i
      )
    );
    taskService.updateBoardTask(workspaceKey, taskKey, updates).catch(() => {
      setIssues(issues);
    });
  };

  const handleCreateIssue = async (
    e: React.FormEvent,
    newIssueForm: CreateIssueForm
  ) => {
    e.preventDefault();

    if (!newIssueForm.title.trim()) return;

    const issue = await taskService.createBoardTask(workspaceKey, newIssueForm);
    setIssues([...issues, issue]);
    setShowCreateIssue(false);
    setNewIssueForm({
      title: "",
      type: "Task",
      priority: "Medium",
      status: "To Do",
      sprintId: null,
    });
    queryClient.invalidateQueries({ queryKey: ["tasks", workspaceKey] });
  };

  const handleUpdateIssue = async (
    updatedIssue: Issue
  ) => {
    if (!updatedIssue.key) {
      toast.error("Khong tim thay task key");
      return;
    }

    const savedIssue = await taskService.updateBoardTask(
      workspaceKey,
      updatedIssue.key,
      updatedIssue,
    );

    setIssues(
      issues.map((i) =>
        i.id === savedIssue.id
          ? savedIssue
          : i
      )
    );

    setSelectedIssue(savedIssue);
  };

  const handleUpdateIssueDate = (
    id: string,
    start: string,
    end: string
  ) => {
    updateIssueDirectly(id, {
      startDate: start,
      endDate: end,
    });
  };

  const handleQuickCreateTask = async (title: string, sprintId: string | null = null) => {
    if (!title.trim()) return;
    try {
      const issue = await taskService.createBoardTask(workspaceKey, {
        title: title.trim(),
        type: "Task",
        priority: "Medium",
        status: "To Do",
        sprintId,
      });
      setIssues(prev => [...prev, issue]);
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceKey] });
    } catch {
      toast.error("Lỗi khi tạo task");
    }
  };

  return {
    handleCreateIssue,
    handleUpdateIssue,
    handleUpdateIssueDate,
    updateIssueDirectly,
    handleQuickCreateTask,
  };
};
