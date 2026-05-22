import { Issue } from "../types/issue.type";
import { taskService } from "../services/taskService";

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
  const updateIssueDirectly = (
    id: string,
    updates: Partial<Issue>
  ) => {
    setIssues(
      issues.map((i) =>
        i.id === id
          ? { ...i, ...updates }
          : i
      )
    );
    taskService.updateBoardTask(workspaceKey, id, updates).catch(() => {
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
  };

  const handleUpdateIssue = async (
    updatedIssue: Issue
  ) => {
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

  return {
    handleCreateIssue,
    handleUpdateIssue,
    handleUpdateIssueDate,
    updateIssueDirectly,
  };
};
