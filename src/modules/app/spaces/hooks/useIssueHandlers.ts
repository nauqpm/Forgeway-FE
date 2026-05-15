import { Issue } from "../types/issue.type";

interface CreateIssueForm {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
}

interface UseIssueHandlersProps {
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
  };

  const handleCreateIssue = (
    e: React.FormEvent,
    newIssueForm: CreateIssueForm
  ) => {
    e.preventDefault();

    if (!newIssueForm.title.trim()) return;

    const issue: Issue = {
      id: Date.now().toString(),
      title: newIssueForm.title,
      status: newIssueForm.status,
      priority: newIssueForm.priority,
      type: newIssueForm.type,
      assignee: "U",
      color: "bg-indigo-600",
      sprintId: newIssueForm.sprintId,
      storyPoints: 0,
      startDate: new Date()
        .toISOString()
        .split("T")[0],

      endDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
    };

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

  const handleUpdateIssue = (
    updatedIssue: Issue
  ) => {
    setIssues(
      issues.map((i) =>
        i.id === updatedIssue.id
          ? updatedIssue
          : i
      )
    );

    setSelectedIssue(updatedIssue);
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