export const SOCKET_LIFECYCLE = {
  CONNECT: "connect",
  CONNECT_ERROR: "connect_error",
  DISCONNECT: "disconnect",
  RECONNECT: "reconnect",
  RECONNECT_ATTEMPT: "reconnect_attempt",
  RATE_LIMITED: "rate_limited",
} as const;

export const SOCKET_COMMANDS = {
  WORKSPACE_JOIN: "workspace:join",
  WORKSPACE_LEAVE: "workspace:leave",
  TASK_JOIN: "task:join",
  TASK_LEAVE: "task:leave",
  PAGE_JOIN: "page:join",
  PAGE_LEAVE: "page:leave",
  PAGE_UPDATE: "page:update",
  PAGE_YJS_UPDATE: "page:yjs-update",
  PAGE_DRAFT_CONTENT: "page:draft-content",
  PAGE_PUBLISH_DRAFT: "page:publish",
} as const;

export const TASK_EVENTS = {
  CREATED: "task.created",
  UPDATED: "task.updated",
  MOVED: "task.moved",
  REORDERED: "task.reordered",
  ARCHIVED: "task.archived",
  RESTORED: "task.restored",
  DELETED: "task.deleted",
} as const;

export const TASK_DETAIL_EVENTS = {
  COMMENT_CREATED: "task.comment.created",
  COMMENT_UPDATED: "task.comment.updated",
  COMMENT_DELETED: "task.comment.deleted",
  ATTACHMENT_ADDED: "task.attachment.added",
  ATTACHMENT_DELETED: "task.attachment.deleted",
  LABELS_UPDATED: "task.labels.updated",
  COVER_UPDATED: "task.cover.updated",
  ACTIVITY_CREATED: "task.activity.created",
} as const;
export const NOTIFICATION_EVENTS = {
  CREATED: "notification.created",
  READ: "notification.read",
  READ_ALL: "notification.read_all",
} as const;

export const LEGACY_EVENTS = {
  BOARD_DELTA: "board:delta",
} as const;

export const SOCKET_EVENTS = {
  ...SOCKET_LIFECYCLE,
  ...SOCKET_COMMANDS,
  TASK_CREATED: TASK_EVENTS.CREATED,
  TASK_UPDATED: TASK_EVENTS.UPDATED,
  TASK_MOVED: TASK_EVENTS.MOVED,
  TASK_REORDERED: TASK_EVENTS.REORDERED,
  TASK_ARCHIVED: TASK_EVENTS.ARCHIVED,
  TASK_RESTORED: TASK_EVENTS.RESTORED,
  TASK_DELETED: TASK_EVENTS.DELETED,
  TASK_COMMENT_CREATED: TASK_DETAIL_EVENTS.COMMENT_CREATED,
  TASK_COMMENT_UPDATED: TASK_DETAIL_EVENTS.COMMENT_UPDATED,
  TASK_COMMENT_DELETED: TASK_DETAIL_EVENTS.COMMENT_DELETED,
  TASK_ATTACHMENT_ADDED: TASK_DETAIL_EVENTS.ATTACHMENT_ADDED,
  TASK_ATTACHMENT_DELETED: TASK_DETAIL_EVENTS.ATTACHMENT_DELETED,
  TASK_LABELS_UPDATED: TASK_DETAIL_EVENTS.LABELS_UPDATED,
  TASK_COVER_UPDATED: TASK_DETAIL_EVENTS.COVER_UPDATED,
  TASK_ACTIVITY_CREATED: TASK_DETAIL_EVENTS.ACTIVITY_CREATED,
  NOTIFICATION_CREATED: NOTIFICATION_EVENTS.CREATED,
  NOTIFICATION_READ: NOTIFICATION_EVENTS.READ,
  NOTIFICATION_READ_ALL: NOTIFICATION_EVENTS.READ_ALL,
  PAGE_UPDATED: "page.updated",
  PAGE_YJS_UPDATE_RECEIVED: "page.yjs-update",
} as const;

export type SocketEventName =
  | (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
  | (typeof LEGACY_EVENTS)[keyof typeof LEGACY_EVENTS];
