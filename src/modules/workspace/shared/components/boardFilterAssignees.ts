export type BoardFilterAssignee = {
  id: string;
  name?: string | null;
  fullName?: string | null;
  email?: string | null;
};

export const getBoardFilterAssigneeLabel = (user: BoardFilterAssignee) =>
  user.name || user.fullName || user.email || (user.id === "U" ? "Unassigned" : user.id);

export const filterBoardAssignees = (
  assignees: BoardFilterAssignee[],
  search: string,
) => {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return assignees;

  return assignees.filter((user) => {
    const label = getBoardFilterAssigneeLabel(user).toLowerCase();
    const email = user.email?.toLowerCase() ?? "";

    return label.includes(normalizedSearch) || email.includes(normalizedSearch);
  });
};
