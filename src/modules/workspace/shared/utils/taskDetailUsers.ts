import { TaskDetailResponse, TaskDetailUser } from "../types/task-detail.type";
import { Workspace } from "../types/workspace.type";

type WorkspaceMember = NonNullable<Workspace["members"]>[number];

const getMemberUser = (member: WorkspaceMember) => {
  const user = member.userId;
  if (typeof user === "string") return null;

  const id = user._id ?? user.id;
  if (!id) return null;

  return {
    id,
    fullName: user.fullName ?? user.name ?? user.email ?? id,
    email: user.email,
    avatar: user.avatar ?? user.avatarUrl ?? user.image,
  } satisfies TaskDetailUser;
};

const findUserById = (
  members: Workspace["members"] | undefined,
  userId?: string | null,
) => {
  if (!members || !userId) return null;

  for (const member of members) {
    const rawUser = member.userId;
    if (typeof rawUser === "string") {
      if (rawUser === userId) return null;
      continue;
    }

    if (rawUser._id === userId || rawUser.id === userId) {
      return getMemberUser(member);
    }
  }

  return null;
};

export const enrichTaskDetailUsers = (
  task: TaskDetailResponse,
  members: Workspace["members"] | undefined,
): TaskDetailResponse => {
  const reporter =
    task.reporter?.fullName || task.reporter?.email
      ? task.reporter
      : findUserById(members, task.reporterId);
  const assignee =
    task.assignee?.fullName || task.assignee?.email
      ? task.assignee
      : findUserById(members, task.assigneeId);

  return {
    ...task,
    reporter: reporter ?? task.reporter,
    assignee: assignee ?? task.assignee,
    assigneeDisplayName:
      assignee?.fullName ?? assignee?.email ?? task.assigneeDisplayName,
  };
};
