import { useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Issue } from "../types/issue.type";
import { taskService } from "../services/taskService";
import { toast } from "react-hot-toast";
import { extractApiError } from "@/common/utils/apiError";

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

const upsertIssue = (current: Issue[], issue: Issue): Issue[] => {
  const id = issue.id || issue._id;
  const exists = current.some((item) => (item.id || item._id) === id);
  if (exists) return current.map((item) => (item.id || item._id) === id ? { ...item, ...issue } : item);
  return [...current, issue];
};

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

  const updateIssueDirectly = useCallback(
    (id: string, updates: Partial<Issue>) => {
      const existingIssue = issues.find((issue) => issue.id === id);
      if (!existingIssue) {
        toast.error("No task");
        return;
      }
      
      // Optimistic update
      setIssues((current) =>
        current.map((i) => (i.id === id ? { ...i, ...updates } : i))
      );
      
      taskService.updateBoardTask(workspaceId, id, updates)
        .then((savedIssue) => {
          const nextIssue = (() => {
            const isObjectId = /^[0-9a-f]{24}$/i.test(savedIssue.status ?? '');
            return isObjectId && updates.status
              ? { ...savedIssue, status: updates.status as string }
              : savedIssue;
          })();

          setIssues((current) =>
            current.map((issue) => (issue.id === nextIssue.id ? nextIssue : issue))
          );
          queryClient.setQueriesData<Issue[]>(
            { queryKey: ["tasks", workspaceId] },
            (current) =>
              Array.isArray(current)
                ? current.map((issue) => (issue.id === nextIssue.id ? nextIssue : issue))
                : current,
          );
          queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceId, id] });
          if (savedIssue.key) {
            queryClient.invalidateQueries({ queryKey: ["taskDetail", workspaceId, savedIssue.key] });
          }
        })
        .catch((error) => {
          // Rollback on error
          setIssues((current) =>
            current.map((i) => (i.id === id ? existingIssue : i))
          );
          toast.error(extractApiError(error, "Could not update task"));
        });
    },
    [issues, queryClient, workspaceId, setIssues]
  );

  const handleCreateIssue = async (
    e: React.FormEvent,
    newIssueForm: CreateIssueForm
  ) => {
    e.preventDefault();

    if (!newIssueForm.title.trim() || isCreatingRef.current) return;

    isCreatingRef.current = true;
    try {
      const issue = await taskService.createBoardTask(workspaceId, newIssueForm);
      setIssues((current) => upsertIssue(current, issue));
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
    } catch (error) {
      toast.error(extractApiError(error, "Could not create task"));
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

      if (savedIssue.key) {
        queryClient.setQueryData(
          ["taskDetail", workspaceId, savedIssue.key],
          (current: Issue | undefined) =>
            current ? { ...current, ...savedIssue } : savedIssue,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["taskActivities", workspaceId, updatedIssue.id] });
      if (savedIssue.key) {
        queryClient.invalidateQueries({ queryKey: ["taskDetail", workspaceId, savedIssue.key] });
      }
    } catch (error) {
      toast.error(extractApiError(error, "Could not update task"));
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
      setIssues((current) => upsertIssue(current, issue));
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    } catch (error) {
      toast.error(extractApiError(error, "Could not create task"));
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
      setIssues((current) => upsertIssue(current, issue));
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    } catch (error) {
      toast.error(extractApiError(error, 'Could not create task'));
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
      setIssues((current) => upsertIssue(current, issue));
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    } catch (error) {
      toast.error(extractApiError(error, "Could not create work item"));
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
