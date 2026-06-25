// /src/common/constants/queryKeys.ts

const PROFILE = ["profile"] as const;
const WORKSPACES = ["workspaces"] as const;
const PROJECTS = ["projects"] as const;
const BOARD = ["board"] as const;
const TASKS = ["tasks"] as const;
const SPRINTS = ["sprints"] as const;
const DOCS = ["docs"] as const;
const NOTIFICATIONS = ["notifications"] as const;
const ADMIN = ["admin"] as const;
const STAFF = ["staff"] as const;
const CHAT = ["chat"] as const;
const SEARCH = ["search"] as const;

export const queryKeys = {
  profile: {
    all: PROFILE,
    detail: () => [...PROFILE, "detail"] as const,
  },
  workspaces: {
    all: WORKSPACES,
    list: () => [...WORKSPACES, "list"] as const,
    forYou: () => [...WORKSPACES, "for-you"] as const,
    byId: (id: string) => [...WORKSPACES, "detail", "id", id] as const,
    bySlug: (slug: string) => [...WORKSPACES, "detail", "slug", slug] as const,
    members: (workspaceId: string) => [...WORKSPACES, "members", workspaceId] as const,
    invites: (workspaceId: string) => [...WORKSPACES, "invites", workspaceId] as const,
    labels: (workspaceId: string) => [...WORKSPACES, "labels", workspaceId] as const,
    board: (workspaceId: string) => [...WORKSPACES, "board", workspaceId] as const,
  },
  projects: {
    all: PROJECTS,
    list: (workspaceId?: string) =>
      workspaceId ? ([...PROJECTS, "list", workspaceId] as const) : ([...PROJECTS, "list"] as const),
    detail: (projectId: string) => [...PROJECTS, "detail", projectId] as const,
    board: (projectId: string) => [...PROJECTS, "board", projectId] as const,
    tasks: (projectId: string) => [...PROJECTS, "tasks", projectId] as const,
  },
  board: {
    all: BOARD,
    byWorkspace: (workspaceId: string) => [...BOARD, workspaceId] as const,
  },
  tasks: {
    all: TASKS,
    byWorkspace: (workspaceId: string, filters?: Record<string, unknown>) =>
      filters
        ? ([...TASKS, workspaceId, filters] as const)
        : ([...TASKS, workspaceId] as const),
    detail: (workspaceId: string, taskKey: string) => [...TASKS, "detail", workspaceId, taskKey] as const,
    detailById: (taskId: string) => [...TASKS, "detail-by-id", taskId] as const,
    activities: (workspaceId: string, taskId: string) => [...TASKS, "activities", workspaceId, taskId] as const,
    activitiesPage: (workspaceId: string, taskId: string, taskKey: string, page: number) =>
      [...TASKS, "activities", workspaceId, taskId, taskKey, page] as const,
    comments: (workspaceId: string, taskId: string) => [...TASKS, "comments", workspaceId, taskId] as const,
    detailComments: (workspaceId: string, taskId: string) => [...TASKS, "detail-comments", workspaceId, taskId] as const,
    commentsByTaskId: (taskId: string) => [...TASKS, "comments-by-task-id", taskId] as const,
    attachments: (workspaceId: string, taskId: string) => [...TASKS, "attachments", workspaceId, taskId] as const,
    myTasks: (userId: string) => [...TASKS, "my-tasks", userId] as const,
    archived: (workspaceId: string, page: number) => [...TASKS, "archived", workspaceId, page] as const,
    searchDropdown: (workspaceId: string, filters: Record<string, unknown>) =>
      [...TASKS, "search-dropdown", workspaceId, filters] as const,
    searchDropdownFallback: (workspaceId: string, filters: Record<string, unknown>) =>
      [...TASKS, "search-dropdown-fallback", workspaceId, filters] as const,
  },
  sprints: {
    all: SPRINTS,
    byWorkspace: (workspaceId: string) => [...SPRINTS, workspaceId] as const,
    detail: (sprintId: string) => [...SPRINTS, "detail", sprintId] as const,
    tasks: (workspaceId: string, sprintId: string) => [...SPRINTS, "tasks", workspaceId, sprintId] as const,
    completePreview: (workspaceId: string, sprintId: string) =>
      [...SPRINTS, "complete-preview", workspaceId, sprintId] as const,
  },
  docs: {
    all: DOCS,
    library: () => [...DOCS, "library"] as const,
    uploadedByWorkspace: (workspaceId: string) => [...DOCS, "uploaded", workspaceId] as const,
    list: (workspaceId: string) => [...DOCS, "list", workspaceId] as const,
    byId: (workspaceId: string, documentId: string) => [...DOCS, "detail", workspaceId, "id", documentId] as const,
    bySlug: (workspaceId: string, slug: string) => [...DOCS, "detail", workspaceId, "slug", slug] as const,
    comments: (documentId: string) => [...DOCS, "comments", documentId] as const,
    versions: (documentId: string) => [...DOCS, "versions", documentId] as const,
    viewBlob: (documentId: string) => [...DOCS, "view-blob", documentId] as const,
    previewHtml: (documentId: string) => [...DOCS, "preview-html", documentId] as const,
  },
  notifications: {
    all: NOTIFICATIONS,
    list: () => [...NOTIFICATIONS, "list"] as const,
    unreadCount: () => [...NOTIFICATIONS, "unread-count"] as const,
  },
  admin: {
    all: ADMIN,
    dashboard: () => [...ADMIN, "dashboard"] as const,
    dashboardForUser: (userId: string) => [...ADMIN, "dashboard", userId] as const,
    users: (filters?: Record<string, unknown>) =>
      filters
        ? ([...ADMIN, "users", filters] as const)
        : ([...ADMIN, "users"] as const),
    workflows: () => [...ADMIN, "workflows"] as const,
    settings: (workspaceId: string) => [...ADMIN, "settings", workspaceId] as const,
  },
  staff: {
    all: STAFF,
    dashboard: () => [...STAFF, "dashboard"] as const,
    users: (filters?: Record<string, unknown>) =>
      filters
        ? ([...STAFF, "users", filters] as const)
        : ([...STAFF, "users"] as const),
    workflows: () => [...STAFF, "workflows"] as const,
    settings: (workspaceId: string) => [...STAFF, "settings", workspaceId] as const,
  },
  chat: {
    all: CHAT,
    channels: () => [...CHAT, "channels"] as const,
    channel: (channelId: string) => [...CHAT, "channels", "detail", channelId] as const,
    messages: (channelId: string) => [...CHAT, "messages", channelId] as const,
    members: (channelId: string) => [...CHAT, "members", channelId] as const,
    mentionMembers: (channelId: string, query: string) => [...CHAT, "mention-members", channelId, query] as const,
    searchUsers: (query: string) => [...CHAT, "users", "search", query] as const,
    activeMeeting: (channelId: string) => [...CHAT, "meetings", "active", channelId] as const,
    stickers: () => [...CHAT, "stickers"] as const,
    threadReplies: (channelId: string, messageId: string) => [...CHAT, "threads", "replies", channelId, messageId] as const,
    activeThreads: (channelId: string) => [...CHAT, "threads", "active", channelId] as const,
  },
  search: {
    all: SEARCH,
    global: (params: {
      q: string;
      types: readonly string[];
      workspaceIds: readonly string[];
      assigneeIds: readonly string[];
      authorIds: readonly string[];
      reporterId: string;
      status: readonly string[];
      taskType: readonly string[];
      priority: readonly string[];
      updatedAfter: string;
      updatedBefore: string;
      cursor: string;
    }) =>
      [
        ...SEARCH,
        "global",
        params.q,
        params.types,
        params.workspaceIds,
        params.assigneeIds,
        params.authorIds,
        params.reporterId,
        params.status,
        params.taskType,
        params.priority,
        params.updatedAfter,
        params.updatedBefore,
        params.cursor,
      ] as const,
  },
} as const;
