import { useRef } from "react";
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
  assigneeId: string;
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
  const isCreatingRef = useRef(false);

  const updateIssueDirectly = (
    id: string,
    updates: Partial<Issue>
  ) => {
    if (!id) {
      toast.error("Khong tim thay task id");
      return;
    }

    setIssues(
      issues.map((i) =>
        i.id === id
          ? { ...i, ...updates }
          : i
      )
    );
    taskService.updateBoardTask(workspaceKey, id, updates)
      .then((savedIssue) => {
        setIssues((current) =>
          current.map((issue) => issue.id === savedIssue.id ? savedIssue : issue)
        );
        queryClient.invalidateQueries({ queryKey: ["tasks", workspaceKey] });
        queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceKey, id] });
      })
      .catch((error) => {
        setIssues(issues);
        toast.error(error?.response?.data?.message || "Khong cap nhat duoc issue");
      });
  };

  const handleCreateIssue = async (
    e: React.FormEvent,
    newIssueForm: CreateIssueForm
  ) => {
    e.preventDefault();

    if (!newIssueForm.title.trim() || isCreatingRef.current) return;

    isCreatingRef.current = true;
    try {
      const issue = await taskService.createBoardTask(workspaceKey, newIssueForm);
      setIssues((current) => [...current, issue]);
      setShowCreateIssue(false);
      setNewIssueForm({
        title: "",
        type: "Task",
        priority: "Medium",
        status: "To Do",
        sprintId: null,
        assigneeId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceKey] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong tao duoc issue");
    } finally {
      isCreatingRef.current = false;
    }
  };

  const handleUpdateIssue = async (
    updatedIssue: Issue
  ) => {
    if (!updatedIssue.key) {
      toast.error("Khong tim thay task key");
      return;
    }

    try {
      const savedIssue = await taskService.updateBoardTask(
        workspaceKey,
        updatedIssue.id,
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
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceKey] });
      queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceKey, updatedIssue.id] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong cap nhat duoc issue");
    }
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
    if (!title.trim() || isCreatingRef.current) return;
    isCreatingRef.current = true;
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
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Loi khi tao task");
    } finally {
      isCreatingRef.current = false;
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
