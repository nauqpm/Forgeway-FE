"use client";

import React, { useEffect } from "react";
import { chatSocketClient } from "@/lib/socket/chat.client";
import { MEETING_EVENTS } from "@/lib/socket/socket.events";
import {
  MeetingEndedPayload,
  MeetingStartedPayload,
  MeetingUserPayload,
  unwrapSocketPayload,
} from "../types/webrtc.types";
import { Loader2, Video } from "lucide-react";
import { useActiveMeeting } from "@/modules/client/chat/hooks/useChatQueries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import type { Meeting } from "../services/meeting.api";
import { useAuthStore } from "@/modules/auth/shared/stores/authStore";

interface MeetingBannerProps {
  channelId: string;
}

export default function MeetingBanner({ channelId }: MeetingBannerProps) {
  const queryClient = useQueryClient();
  const { data: activeMeeting = null, isLoading } = useActiveMeeting(channelId);
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    const socket = chatSocketClient.getSocket();
    if (!socket) return;

    // Listen for new meetings starting in this channel
    const handleMeetingStarted = (
      envelope: MeetingStartedPayload | { data: MeetingStartedPayload },
    ) => {
      const data = unwrapSocketPayload(envelope);
      if (data.channelId === channelId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeMeeting(channelId) });
      }
    };

    // Listen for the active meeting ending
    const handleMeetingEnded = (
      envelope: MeetingEndedPayload | { data: MeetingEndedPayload },
    ) => {
      const data = unwrapSocketPayload(envelope);
      queryClient.setQueryData<Meeting | null>(queryKeys.chat.activeMeeting(channelId), (current) =>
        current?._id === data.meetingId ? null : current,
      );
    };

    // Listen for participants joining/leaving to update count
    const handleParticipantChange = (
      envelope: MeetingUserPayload | { data: MeetingUserPayload },
    ) => {
      const data = unwrapSocketPayload(envelope);
      if (!data.participants) return;

      queryClient.setQueryData<Meeting | null>(queryKeys.chat.activeMeeting(channelId), (current) =>
        current?._id === data.meetingId
          ? {
              ...current,
              participants: data.participants!.map((participant) => {
                const isAudioOn =
                  participant.isAudioOn ??
                  (typeof participant.isMuted === "boolean"
                    ? !participant.isMuted
                    : true);

                return {
                  userId: participant.userId,
                  joinedAt: new Date().toISOString(),
                  isAudioOn,
                  isVideoOn: participant.isVideoOn ?? true,
                  isMuted: participant.isMuted ?? !isAudioOn,
                  displayName: participant.displayName,
                  name: participant.name,
                };
              }),
            }
          : current,
      );
    };

    socket.on(MEETING_EVENTS.STARTED, handleMeetingStarted);
    socket.on(MEETING_EVENTS.ENDED, handleMeetingEnded);
    socket.on(MEETING_EVENTS.USER_JOINED, handleParticipantChange);
    socket.on(MEETING_EVENTS.USER_LEFT, handleParticipantChange);

    return () => {
      socket.off(MEETING_EVENTS.STARTED, handleMeetingStarted);
      socket.off(MEETING_EVENTS.ENDED, handleMeetingEnded);
      socket.off(MEETING_EVENTS.USER_JOINED, handleParticipantChange);
      socket.off(MEETING_EVENTS.USER_LEFT, handleParticipantChange);
    };
  }, [channelId, queryClient]);

  if (!activeMeeting && !isLoading) return null;

  const handleJoin = () => {
    if (!activeMeeting?._id) return;

    const meetingUrl = `/meeting/${activeMeeting._id}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _opened = window.open(meetingUrl, "_blank", "noopener,noreferrer");

    // if (!opened) {
    //   toast.error('Popup blocked. Opening the meeting in this tab.');
    //   window.location.href = meetingUrl;
    // }
  };

  const participantCount = activeMeeting?.participants?.length || 0;
  const isParticipant = activeMeeting?.participants?.some(
    (p) => String(p.userId) === String(currentUserId)
  );
  
  // Fallback matches MAX_MESH_CLIENTS on the server (currently 2 for testing)
  const maxParticipants = activeMeeting?.maxParticipants ?? 2;
  const isRoomFull = !isParticipant && participantCount >= maxParticipants;

  const meetingLabel =
    activeMeeting?.type === "voice"
      ? "Active Voice Call"
      : "Active Video Meeting";

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#E8F3FF] dark:bg-[#1E293B] border-b border-[#D1E4FF] dark:border-[#334155] shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2563EB] text-white animate-pulse">
          <Video className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#1E3A8A] dark:text-[#93C5FD]">
            {meetingLabel}
          </span>
          <span className="text-xs text-[#1E40AF] dark:text-[#BFDBFE]">
            {isLoading
              ? "Checking meeting status..."
              : `${participantCount} ${participantCount === 1 ? "person is" : "people are"} in the meeting`}
          </span>
        </div>
      </div>
      <button
        onClick={handleJoin}
        disabled={!activeMeeting || isLoading || isRoomFull}
        className="px-4 py-1.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRoomFull ? (
          "Room Full"
        ) : isParticipant ? (
          "Rejoin Meeting"
        ) : (
          "Join Meeting"
        )}
      </button>
    </div>
  );
}
