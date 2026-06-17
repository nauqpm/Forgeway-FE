/**
 * WebRTC types for the Meeting Voice/Video feature.
 * Consumed by the useWebRTC hook and MeetingPage.
 */

export interface RemotePeer {
  userId: string;
  stream: MediaStream | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
  displayName?: string;
}

export type MeetingType = 'voice' | 'video';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, RemotePeer>;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  capacityWarning: boolean;
  mediaStatus: 'pending' | 'ready' | 'audio-only' | 'unavailable';
}

export interface WebRTCActions {
  toggleAudio: () => void;
  toggleVideo: () => void;
  leave: () => void;
  endForAll: () => void;
}

export type UseWebRTCReturn = WebRTCState & WebRTCActions;

export interface MeetingSocketParticipant {
  userId: string;
  displayName?: string;
  name?: string;
  isAudioOn?: boolean;
  isVideoOn?: boolean;
  isMuted?: boolean;
}

export interface MeetingStartedPayload {
  meetingId?: string;
  channelId: string;
  type?: MeetingType;
  participants?: MeetingSocketParticipant[];
}

export interface MeetingEndedPayload {
  meetingId: string;
  type?: MeetingType;
}

export interface MeetingUserPayload {
  meetingId: string;
  userId: string;
  type?: MeetingType;
  displayName?: string;
  name?: string;
  isAudioOn?: boolean;
  isVideoOn?: boolean;
  isMuted?: boolean;
  participants?: MeetingSocketParticipant[];
}

export interface MeetingTogglePayload {
  meetingId?: string;
  userId: string;
  isOn: boolean;
}

export interface RtcSessionPayload {
  meetingId?: string;
  senderId: string;
  targetUserId?: string;
  sdp: RTCSessionDescriptionInit;
  displayName?: string;
}

export interface RtcIcePayload {
  meetingId?: string;
  senderId: string;
  targetUserId?: string;
  candidate: RTCIceCandidateInit;
}

export type SocketEnvelope<T> = T | { data: T };

export const unwrapSocketPayload = <T>(envelope: SocketEnvelope<T>): T => {
  if (
    envelope &&
    typeof envelope === 'object' &&
    'data' in envelope &&
    (envelope as { data?: T }).data
  ) {
    return (envelope as { data: T }).data;
  }

  return envelope as T;
};
