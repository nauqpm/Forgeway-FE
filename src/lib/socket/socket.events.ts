export const SOCKET_LIFECYCLE = {
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RATE_LIMITED: 'rate_limited',
} as const;

export const SOCKET_COMMANDS = {
  WORKSPACE_JOIN: 'workspace:join',
  WORKSPACE_LEAVE: 'workspace:leave',
  TASK_JOIN: 'task:join',
  TASK_LEAVE: 'task:leave',
} as const;

export const TASK_EVENTS = {
  CREATED: 'task.created',
  UPDATED: 'task.updated',
  MOVED: 'task.moved',
  REORDERED: 'task.reordered',
  ARCHIVED: 'task.archived',
  RESTORED: 'task.restored',
  DELETED: 'task.deleted',
} as const;

export const NOTIFICATION_EVENTS = {
  CREATED: 'notification.created',
  READ: 'notification.read',
  READ_ALL: 'notification.read_all',
} as const;

export const LEGACY_EVENTS = {
  BOARD_DELTA: 'board:delta',
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
  NOTIFICATION_CREATED: NOTIFICATION_EVENTS.CREATED,
  NOTIFICATION_READ: NOTIFICATION_EVENTS.READ,
  NOTIFICATION_READ_ALL: NOTIFICATION_EVENTS.READ_ALL,
} as const;

export type SocketEventName =
  | (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
  | (typeof LEGACY_EVENTS)[keyof typeof LEGACY_EVENTS];