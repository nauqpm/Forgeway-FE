import { useRef, useCallback } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { Issue } from "../types/issue.type";
import { taskService } from "../services/taskService";
import { toast } from "react-hot-toast";
import { extractApiError } from "@/shared/utils/apiError";

interface CreateIssueForm {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
  assigneeId: string;
  columnId?: string | null;
}

interface UseTaskHandlersProps {
  workspaceId: string;
  setShowCreateIssue: React.Dispatch<React.SetStateAction<boolean>>;
  setNewIssueForm: React.Dispatch<React.SetStateAction<CreateIssueForm>>;
  setSelectedIssue: React.Dispatch<React.SetStateAction<Issue | null>>;
}

const upsertIssue = (current: Issue[], issue: Issue): Issue[] => {
  const id = issue.id || issue._id;
  const exists = current.some((item) => (item.id || item._id) === id);
  if (exists) return current.map((item) => (item.id || item._id) === id ? { ...item, ...issue } : item);
  return [...current, issue];
};

const invalidateDashboard = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
};

export const useTaskHandlers = ({
  workspaceId,
  setShowCreateIssue,
  setNewIssueForm,
  setSelectedIssue,
}: UseTaskHandlersProps) => {
  const queryClient = useQueryClient();
  const isCreatingRef = useRef(false);

  const updateIssueDirectly = useCallback(
    (id: string, updates: Partial<Issue>) => {
      const queryKeyPrefix = queryKeys.tasks.byWorkspace(workspaceId);

      // Take snapshot of previous state for rollback
      let previousQueriesData: [unknown, Issue[] | undefined][] = [];
      try {
        previousQueriesData = queryClient.getQueriesData<Issue[]>({ queryKey: queryKeyPrefix });
      } catch {
        // Ignored
      }

      // Optimistic update of all matching task queries
      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeyPrefix },
        (current) =>
          Array.isArray(current)
            ? current.map((i) => (i.id === id ? { ...i, ...updates } : i))
            : current
      );

      // Find the issue to update task detail cache if present
      let existingIssue: Issue | undefined;
      for (const [, data] of previousQueriesData) {
        if (Array.isArray(data)) {
          existingIssue = data.find((i) => i.id === id);
          if (existingIssue) break;
        }
      }

      if (existingIssue && existingIssue.key) {
        queryClient.setQueryData<Issue>(
          queryKeys.tasks.detail(workspaceId, existingIssue.key),
          (current) => (current ? { ...current, ...updates } : current)
        );
      }

      taskService.updateBoardTask(workspaceId, id, updates)
        .then((savedIssue: Issue) => {
          const nextIssue = (() => {
            const isObjectId = /^[0-9a-f]{24}$/i.test(savedIssue.status ?? "");
            return isObjectId && updates.status
              ? { ...savedIssue, status: updates.status as string }
              : savedIssue;
          })();

          queryClient.setQueriesData<Issue[]>(
            { queryKey: queryKeyPrefix },
            (current) =>
              Array.isArray(current)
                ? current.map((issue) => (issue.id === nextIssue.id ? nextIssue : issue))
                : current
          );

          if (nextIssue.key) {
            queryClient.setQueryData(queryKeys.tasks.detail(workspaceId, nextIssue.key), nextIssue);
          }

          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activities(workspaceId, id) });
          invalidateDashboard(queryClient);
        })
        .catch((error: unknown) => {
          // Rollback on error
          if (previousQueriesData.length > 0) {
            for (const [key, data] of previousQueriesData as [QueryKey, Issue[] | undefined][]) {
              queryClient.setQueryData(key, data);
            }
          }
          if (existingIssue && existingIssue.key) {
            queryClient.setQueryData(queryKeys.tasks.detail(workspaceId, existingIssue.key), existingIssue);
          }
          toast.error(extractApiError(error, "Could not update task"));
        });
    },
    [queryClient, workspaceId]
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
      const queryKeyPrefix = queryKeys.tasks.byWorkspace(workspaceId);

      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeyPrefix },
        (current) => (Array.isArray(current) ? upsertIssue(current, issue) : [issue])
      );

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
      queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
      invalidateDashboard(queryClient);
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

    const queryKeyPrefix = queryKeys.tasks.byWorkspace(workspaceId);

    // Snapshot for rollback
    let previousQueriesData: [unknown, Issue[] | undefined][] = [];
    try {
      previousQueriesData = queryClient.getQueriesData<Issue[]>({ queryKey: queryKeyPrefix });
    } catch { /* ignored */ }
    const previousDetail = updatedIssue.key
      ? queryClient.getQueryData<Issue>(queryKeys.tasks.detail(workspaceId, updatedIssue.key))
      : undefined;

    // Optimistic update — show new value immediately
    queryClient.setQueriesData<Issue[]>(
      { queryKey: queryKeyPrefix },
      (current) => Array.isArray(current)
        ? current.map((i) => (i.id === updatedIssue.id ? { ...i, ...updatedIssue } : i))
        : current
    );
    setSelectedIssue(updatedIssue);
    if (updatedIssue.key) {
      queryClient.setQueryData(queryKeys.tasks.detail(workspaceId, updatedIssue.key), updatedIssue);
    }

    try {
      const savedIssue = await taskService.updateBoardTask(
        workspaceId,
        updatedIssue.id,
        updatedIssue,
      );

      // Reconcile with server response
      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeyPrefix },
        (current) => Array.isArray(current)
          ? current.map((i) => (i.id === savedIssue.id ? savedIssue : i))
          : current
      );
      setSelectedIssue(savedIssue);
      if (savedIssue.key) {
        queryClient.setQueryData(queryKeys.tasks.detail(workspaceId, savedIssue.key), savedIssue);
      }

      queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.activities(workspaceId, updatedIssue.id) });
      invalidateDashboard(queryClient);
    } catch (error) {
      // Rollback on API failure
      for (const [key, data] of previousQueriesData as [QueryKey, Issue[] | undefined][]) {
        queryClient.setQueryData(key, data);
      }
      if (updatedIssue.key) {
        queryClient.setQueryData(queryKeys.tasks.detail(workspaceId, updatedIssue.key), previousDetail);
      }
      setSelectedIssue(previousDetail ?? null);
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
      const queryKeyPrefix = queryKeys.tasks.byWorkspace(workspaceId);
      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeyPrefix },
        (current) => (Array.isArray(current) ? upsertIssue(current, issue) : [issue])
      );
      queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
      invalidateDashboard(queryClient);
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
      const queryKeyPrefix = queryKeys.tasks.byWorkspace(workspaceId);
      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeyPrefix },
        (current) => (Array.isArray(current) ? upsertIssue(current, issue) : [issue])
      );
      queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
      invalidateDashboard(queryClient);
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
      const queryKeyPrefix = queryKeys.tasks.byWorkspace(workspaceId);
      queryClient.setQueriesData<Issue[]>(
        { queryKey: queryKeyPrefix },
        (current) => (Array.isArray(current) ? upsertIssue(current, issue) : [issue])
      );
      queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
      invalidateDashboard(queryClient);
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
