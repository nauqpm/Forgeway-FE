export type RealtimeConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface RealtimeEnvelope<TData> {
  eventId: string;
  type: string;
  correlationId?: string;
  causationId?: string;
  workspaceId?: string;
  actorId?: string;
  entityId?: string;
  version?: number;
  occurredAt: string;
  data: TData;
}

export interface RealtimeStatusSnapshot {
  status: RealtimeConnectionStatus;
  socketId?: string;
  currentWorkspaceId?: string;
  lastError?: string;
}

export interface WorkspaceRoomPayload {
  workspaceId: string;
}

export interface TaskRoomPayload extends WorkspaceRoomPayload {
  taskId: string;
}