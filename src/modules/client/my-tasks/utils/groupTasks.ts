import { Task, GroupBy, SortBy, priorityOrder } from "../types/myTasks.type";

export function sortTasks(tasks: Task[], sortBy: SortBy): Task[] {
  return [...tasks].sort((a, b) => {
    if (sortBy === "priority") {
      return (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5);
    }
    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });
}

export function groupTasks(tasks: Task[], groupBy: GroupBy): Record<string, Task[]> {
  return tasks.reduce(
    (acc, task) => {
      let key: string;
      if (groupBy === "status") key = task.status || "todo";
      else if (groupBy === "project") key = task.projectId?.name || "No Project";
      else if (groupBy === "priority") key = task.priority || "medium";
      else key = "all";
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );
}
