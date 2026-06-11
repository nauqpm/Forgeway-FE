// Shared types and pure helper functions used by TaskDetailModal, TaskDetailDrawer, TaskDetailList

export type WorkspaceMember = {
  userId?:
    | string
    | {
        _id?: string;
        id?: string;
        fullName?: string;
        name?: string;
        email?: string;
        avatar?: string;
        avatarUrl?: string;
        image?: string;
      };
  role?: string;
};

export type SprintOption = {
  _id?: string;
  id?: string;
  name?: string;
};

export const getUserDisplayName = (user: any, fallback?: string | null): string => {
  if (typeof user === "string") return user;
  return user?.fullName || user?.email || fallback || "Unassigned";
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const toDateInputValue = (value?: string | null): string => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

export const getIssueAssigneeId = (issue: any): string => {
  if (issue?.assigneeId) return String(issue.assigneeId);
  if (typeof issue?.assignee === "string") return issue.assignee === "U" ? "" : issue.assignee;
  return issue?.assignee?._id || issue?.assignee?.id || "";
};

export const mapMemberOptions = (
  members: WorkspaceMember[],
): Array<{ id: string; label: string; email?: string }> =>
  members
    .map((member) => {
      const user = member.userId;
      if (!user || typeof user === "string") {
        return user ? { id: user, label: user } : null;
      }
      const id = user._id || user.id;
      if (!id) return null;
      return {
        id,
        label: user.fullName || user.name || user.email || id,
        email: user.email,
      };
    })
    .filter(Boolean) as Array<{ id: string; label: string; email?: string }>;
