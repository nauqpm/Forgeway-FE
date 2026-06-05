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
  columnId?: string | null;
}

interface UseIssueHandlersProps {
  workspaceId: string;

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

export const useTaskHandlers = ({
  workspaceId,
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
    const existingIssue = issues.find((issue) => issue.id === id);
    if (!existingIssue) {
      toast.error("No task");
      return;
    }
    setIssues(
      issues.map((i) =>
        i.id === id
          ? { ...i, ...updates }
          : i
        )
    );
    taskService.updateBoardTask(workspaceId, id, updates)
      .then((savedIssue) => {
        setIssues((current) =>
          current.map((issue) => {
            if (issue.id !== savedIssue.id) return issue;
            const isObjectId = /^[0-9a-f]{24}$/i.test(savedIssue.status ?? '');
            return isObjectId && updates.status
              ? { ...savedIssue, status: updates.status as string }
              : savedIssue;
          })
        );
        queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
        queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceId, id] });
        if (savedIssue.key) {
          queryClient.invalidateQueries({ queryKey: ["taskDetail", workspaceId, savedIssue.key] });
        }
      })
      .catch((error) => {
        setIssues(issues);
        toast.error(error?.response?.data?.message || "Could not update task");
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
      const issue = await taskService.createBoardTask(workspaceId, newIssueForm);
      setIssues((current) => [...current, issue]);
      setShowCreateIssue(false);
      setNewIssueForm({
        title: "",
        type: "Task",
        priority: "Medium",
        status: "To Do",
        sprintId: null,
        assigneeId: "",
        columnId: null,
      });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not create task");
    } finally {
      isCreatingRef.current = false;
    }
  };

  const handleUpdateIssue = async (
    updatedIssue: Issue
  ) => {
    if (!updatedIssue.id) {
      toast.error("Task ID not found");
      return;
    }

    try {
      const savedIssue = await taskService.updateBoardTask(
        workspaceId,
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
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceId, updatedIssue.id] });
      if (savedIssue.key) {
        queryClient.invalidateQueries({ queryKey: ["taskDetail", workspaceId, savedIssue.key] });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update task");
    }
  };

  const handleUpdateIssueDate = (
    id: string,
    start: string,
    end: string
  ) => {
    updateIssueDirectly(id, {
      startDate: start,
      dueDate: end,
    });
  };

  const handleQuickCreateTask = async (title: string, sprintId: string | null = null) => {
    if (!title.trim() || isCreatingRef.current) return;
    isCreatingRef.current = true;
    try {
      const issue = await taskService.createBoardTask(workspaceId, {
        title: title.trim(),
        type: "Task",
        priority: "Medium",
        status: "To Do",
        sprintId,
      });
      setIssues(prev => [...prev, issue]);
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not create task");
    } finally {
      isCreatingRef.current = false;
    }
  };

  const handleCreateTaskFromList = async (task: {
    title: string;
    type?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
  }) => {
    if (!task.title.trim() || isCreatingRef.current) return;
    isCreatingRef.current = true;
    try {
      const issue = await taskService.createBoardTask(workspaceId, {
        title: task.title.trim(),
        type: task.type || 'Task',
        priority: 'Medium',
        status: 'To Do',
        sprintId: null,
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate || undefined,
      });
      setIssues(prev => [...prev, issue]);
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create task');
    } finally {
      isCreatingRef.current = false;
    }
  };

  const handleQuickCreateCalendarTask = async (title: string, date: string) => {
    if (!title.trim() || isCreatingRef.current) return;
    isCreatingRef.current = true;
    try {
      const issue = await taskService.createBoardTask(workspaceId, {
        title: title.trim(),
        type: "Task",
        priority: "Medium",
        status: "To Do",
        sprintId: null,
        startDate: date,
        dueDate: date,
      });
      setIssues((current) => [...current, issue]);
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not create work item");
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
    handleCreateTaskFromList,
    handleQuickCreateCalendarTask,
  };
};
