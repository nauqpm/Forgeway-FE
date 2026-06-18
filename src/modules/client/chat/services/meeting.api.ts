import api, { isAxiosError } from '@/lib/axiosIns';
import { MeetingType } from '../types/webrtc.types';

export interface MeetingParticipant {
  userId: string;
  joinedAt: string;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isMuted: boolean;
  displayName?: string;
  name?: string;
}

export interface Meeting {
  _id: string;
  channelId: string;
  workspaceId: string;
  createdBy: string;
  status: 'waiting' | 'active' | 'ended';
  type: MeetingType;
  participants: MeetingParticipant[];
  maxParticipants?: number;
  startedAt: string;
  endedAt?: string;
}

export class MeetingApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'MeetingApiError';
  }
}

const getMeetingApiError = (error: unknown, fallback: string): MeetingApiError => {
  if (isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      fallback;

    return new MeetingApiError(message, error.response?.status);
  }

  if (error instanceof Error) {
    return new MeetingApiError(error.message);
  }

  return new MeetingApiError(fallback);
};

const readMeetingResponse = (response: { data?: unknown }): Meeting | null => {
  const payload = response.data as { data?: Meeting } | Meeting | null | undefined;

  if (!payload) return null;
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload
  ) {
    return payload.data ?? null;
  }

  return payload as Meeting;
};

export const getActiveMeetingAPI = async (channelId: string): Promise<Meeting | null> => {
  try {
    const response = await api.get(`/meetings/channel/${channelId}/active`);
    return readMeetingResponse(response);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw getMeetingApiError(error, 'Could not load the active meeting.');
  }
};

export const getMeetingByIdAPI = async (meetingId: string): Promise<Meeting | null> => {
  try {
    const response = await api.get(`/meetings/${meetingId}`);
    return readMeetingResponse(response);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw getMeetingApiError(error, 'Could not load meeting details.');
  }
};

export const createMeetingAPI = async (
  channelId: string,
  type: MeetingType = 'video',
): Promise<Meeting | null> => {
  try {
    const response = await api.post(`/chat/channels/${channelId}/meeting`, { type });
    return readMeetingResponse(response);
  } catch (error) {
    throw getMeetingApiError(error, 'Could not start the meeting.');
  }
};
