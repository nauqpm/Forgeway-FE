export const SOCKET_LIFECYCLE = {
  CONNECT: "connect",
  CONNECT_ERROR: "connect_error",
  DISCONNECT: "disconnect",
  RECONNECT: "reconnect",
  RECONNECT_ATTEMPT: "reconnect_attempt",
  RATE_LIMITED: "rate_limited",
} as const;

export const SOCKET_COMMANDS = {
  WORKSPACE_JOIN: 'workspace:join',
  WORKSPACE_LEAVE: 'workspace:leave',
  TASK_JOIN: 'task:join',
  TASK_LEAVE: 'task:leave',
  PAGE_JOIN: 'page:join',
  PAGE_LEAVE: 'page:leave',
  PAGE_UPDATE: 'page:update',
  PAGE_YJS_UPDATE: 'page:yjs-update',
  PAGE_AWARENESS_UPDATE: 'page:awareness-update',
  PAGE_DRAFT_CONTENT: 'page:draft-content',
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

export const SPRINT_EVENTS = {
  CREATED: 'sprint.created',
  UPDATED: 'sprint.updated',
  DELETED: 'sprint.deleted',
  STARTED: 'sprint.started',
  COMPLETED: 'sprint.completed',
} as const;

export const WORKSPACE_EVENTS = {
  CREATED: 'workspace.created',
  UPDATED: 'workspace.updated',
  ARCHIVED: 'workspace.archived',
  RESTORED: 'workspace.restored',
  DELETED: 'workspace.deleted',
  MEMBER_ADDED: 'workspace.member.joined',
  MEMBER_REMOVED: 'workspace.member.removed',
  MEMBER_ROLE_UPDATED: 'workspace.member.role_updated',
  INVITE_CREATED: 'workspace.invite.created',
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

export const CHAT_EVENTS = {
  // Gửi/Nhận
  SEND: 'chat.send',
  SENT: 'chat.message.sent',

  // Hành động
  EDIT: 'chat.edit',
  EDITED: 'chat.message.edited',
  DELETE: 'chat.delete',
  DELETED: 'chat.message.deleted',
  REACTION: 'chat.reaction',
  REACTION_UPDATED: 'chat.reaction.updated',

  // Trạng thái
  TYPING: 'chat.typing',
  USER_TYPING: 'chat.user.typing',

  // Đã đọc & Thông báo
  READ: 'chat.mark_read',
  UNREAD_UPDATE: 'chat.unread_update',

  // Room
  JOIN: 'chat.join',
  JOINED: 'chat.joined',
  LEAVE: 'chat.leave',

  // Thread & Channel Custom Events
  THREAD_REPLY_CREATED: 'chat.thread.reply.created',
  CHANNEL_CREATED: 'chat.channel.created',
  CHANNEL_UPDATED: 'chat.channel.updated',
  CHANNEL_DELETED: 'chat.channel.deleted',
  CHANNEL_MEMBER_ADDED: 'chat.channel.member.added',
  CHANNEL_MEMBER_REMOVED: 'chat.channel.member.removed',
  KICKED_FROM_CHANNEL: 'chat.kicked.from.channel',
  CHANNEL_VISIBILITY_CHANGED: 'chat.channel.visibility.changed',
} as const;

export const MEETING_EVENTS = {
  // Socket commands (client → server)
  // JOIN: 'meeting.join',
  // LEAVE: 'meeting.leave',
  // END: 'meeting.end',
  // TOGGLE_AUDIO: 'meeting.toggle.audio',
  // TOGGLE_VIDEO: 'meeting.toggle.video',

  // Server → client broadcasts
  USER_JOINED: 'meeting.user.joined',
  USER_LEFT: 'meeting.user.left',
  // USER_AUDIO_CHANGED: 'meeting.user.audio_changed',
  // USER_VIDEO_CHANGED: 'meeting.user.video_changed',
  ENDED: 'meeting.ended',
  STARTED: 'meeting.started',
} as const;



export const SOCKET_EVENTS = {
  ...SOCKET_LIFECYCLE,
  ...SOCKET_COMMANDS,
  ...CHAT_EVENTS,
  TASK_CREATED: TASK_EVENTS.CREATED,
  TASK_UPDATED: TASK_EVENTS.UPDATED,
  TASK_MOVED: TASK_EVENTS.MOVED,
  TASK_REORDERED: TASK_EVENTS.REORDERED,
  TASK_ARCHIVED: TASK_EVENTS.ARCHIVED,
  TASK_RESTORED: TASK_EVENTS.RESTORED,
  TASK_DELETED: TASK_EVENTS.DELETED,
  SPRINT_CREATED: SPRINT_EVENTS.CREATED,
  SPRINT_UPDATED: SPRINT_EVENTS.UPDATED,
  SPRINT_DELETED: SPRINT_EVENTS.DELETED,
  SPRINT_STARTED: SPRINT_EVENTS.STARTED,
  SPRINT_COMPLETED: SPRINT_EVENTS.COMPLETED,
  WORKSPACE_CREATED: WORKSPACE_EVENTS.CREATED,
  WORKSPACE_UPDATED: WORKSPACE_EVENTS.UPDATED,
  WORKSPACE_ARCHIVED: WORKSPACE_EVENTS.ARCHIVED,
  WORKSPACE_RESTORED: WORKSPACE_EVENTS.RESTORED,
  WORKSPACE_DELETED: WORKSPACE_EVENTS.DELETED,
  WORKSPACE_MEMBER_ADDED: WORKSPACE_EVENTS.MEMBER_ADDED,
  WORKSPACE_MEMBER_REMOVED: WORKSPACE_EVENTS.MEMBER_REMOVED,
  WORKSPACE_MEMBER_ROLE_UPDATED: WORKSPACE_EVENTS.MEMBER_ROLE_UPDATED,
  WORKSPACE_INVITE_CREATED: WORKSPACE_EVENTS.INVITE_CREATED,
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
  PAGE_UPDATED: 'page.updated',
  PAGE_YJS_UPDATE_RECEIVED: 'page.yjs-update',
  PAGE_AWARENESS_UPDATE_RECEIVED: 'page.awareness-update',
  PAGE_VERSION_RESTORED: 'page.version-restored',
} as const;

export type SocketEventName =
  | (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
  | (typeof LEGACY_EVENTS)[keyof typeof LEGACY_EVENTS];
