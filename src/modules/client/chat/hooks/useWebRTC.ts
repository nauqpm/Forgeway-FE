"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chatSocketClient } from "@/lib/socket/chat.client";
import { MEETING_EVENTS, RTC_EVENTS } from "@/lib/socket/socket.events";
import toast from "react-hot-toast";
import type {
  MeetingEndedPayload,
  MeetingTogglePayload,
  MeetingType,
  MeetingUserPayload,
  RemotePeer,
  RtcIcePayload,
  RtcSessionPayload,
  SocketEnvelope,
  UseWebRTCReturn,
} from "../types/webrtc.types";
import { unwrapSocketPayload } from "../types/webrtc.types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

const getPeerDisplayName = (payload: MeetingUserPayload): string | undefined =>
  payload.displayName || payload.name;

const getPeerFallbackName = (userId: string): string =>
  `Participant ${userId.slice(-4)}`;

const getPeerAudioState = (
  payload: Pick<MeetingUserPayload, "isAudioOn" | "isMuted">,
): boolean | undefined => {
  if (typeof payload.isAudioOn === "boolean") return payload.isAudioOn;
  if (typeof payload.isMuted === "boolean") return !payload.isMuted;
  return undefined;
};

export function useWebRTC(
  meetingId: string | undefined,
  userId: string | undefined,
  meetingType: MeetingType | undefined,
  currentUserName?: string,
  shouldConnect: boolean = true,
): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemotePeer>>(
    new Map(),
  );
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<
    "pending" | "ready" | "audio-only" | "video-only" | "unavailable"
  >("pending");

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const hasLeftRef = useRef(false);
  const isAudioOnRef = useRef(true);
  const isVideoOnRef = useRef(true);
  const hasJoinedMeetingRef = useRef(false);

  const cleanupPeerConnections = useCallback(() => {
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    pendingIceCandidates.current.clear();
    setRemoteStreams(new Map());
    hasJoinedMeetingRef.current = false;
  }, []);

  const cleanupLocalMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const cleanupAllMeetingResources = useCallback(() => {
    cleanupPeerConnections();
    cleanupLocalMedia();
  }, [cleanupLocalMedia, cleanupPeerConnections]);

  const acquireMedia = useCallback(async (): Promise<MediaStream> => {
    setMediaStatus("pending");

    try {
      if (meetingType === "voice") {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        isAudioOnRef.current = true;
        isVideoOnRef.current = false;
        setIsAudioOn(true);
        setIsVideoOn(false);
        setMediaStatus("ready");
        return stream;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      isAudioOnRef.current = true;
      isVideoOnRef.current = true;
      setIsAudioOn(true);
      setIsVideoOn(true);
      setMediaStatus("ready");
      return stream;
    } catch {
      if (meetingType === "voice") {
        isAudioOnRef.current = false;
        isVideoOnRef.current = false;
        setIsAudioOn(false);
        setIsVideoOn(false);
        setMediaStatus("unavailable");
        return new MediaStream();
      }
      // meeting type = video
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        isAudioOnRef.current = false;
        isVideoOnRef.current = true;
        setIsAudioOn(false);
        setIsVideoOn(true);
        setMediaStatus("video-only");
        return stream;
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          isAudioOnRef.current = true;
          isVideoOnRef.current = false;
          setIsAudioOn(true);
          setIsVideoOn(false);
          setMediaStatus("audio-only");
          return stream;
        } catch {
          isAudioOnRef.current = false;
          isVideoOnRef.current = false;
          setIsAudioOn(false);
          setIsVideoOn(false);
          setMediaStatus("unavailable");
          return new MediaStream();
        }
      }
    }
  }, [meetingType]);

  const processPendingIce = useCallback(
    async (peerId: string, pc: RTCPeerConnection) => {
      const candidates = pendingIceCandidates.current.get(peerId) || [];

      for (const candidate of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.warn(
            "[useWebRTC] Could not add buffered ICE candidate",
            error,
          );
        }
      }

      pendingIceCandidates.current.delete(peerId);
    },
    [],
  );

  const createPeerConnection = useCallback(
    (remotePeerId: string): RTCPeerConnection => {
      const existing = peerConnections.current.get(remotePeerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(ICE_SERVERS);

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        setRemoteStreams((previous) => {
          const next = new Map(previous);
          const current = next.get(remotePeerId);
          next.set(remotePeerId, {
            userId: remotePeerId,
            stream: remoteStream,
            isAudioOn: current?.isAudioOn ?? true,
            isVideoOn: current?.isVideoOn ?? meetingType === "video",
            displayName: current?.displayName,
          });
          return next;
        });
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate || !meetingId) return;

        chatSocketClient.getSocket()?.emit(RTC_EVENTS.ICE, {
          meetingId,
          targetUserId: remotePeerId,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState !== "disconnected" &&
          pc.connectionState !== "failed"
        )
          return;

        setRemoteStreams((previous) => {
          const next = new Map(previous);
          next.delete(remotePeerId);
          return next;
        });

        peerConnections.current.delete(remotePeerId);
        pc.close();
      };

      peerConnections.current.set(remotePeerId, pc);
      return pc;
    },
    [meetingId, meetingType],
  );

  const createAndSendOffer = useCallback(
    async (remotePeerId: string) => {
      if (!meetingId) return;

      try {
        const pc = createPeerConnection(remotePeerId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: meetingType === "video",
        });
        await pc.setLocalDescription(offer);

        chatSocketClient.getSocket()?.emit(RTC_EVENTS.OFFER, {
          meetingId,
          targetUserId: remotePeerId,
          sdp: offer,
          displayName: currentUserName,
        });
      } catch (error) {
        console.error("[useWebRTC] Could not create WebRTC offer", error);
        setConnectionError("Could not connect to a meeting participant.");
      }
    },
    [meetingId, createPeerConnection, currentUserName],
  );

  const toggleAudio = useCallback(() => {
    if (!meetingId) return;

    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    isAudioOnRef.current = audioTrack.enabled;
    setIsAudioOn(audioTrack.enabled);

    if (hasJoinedMeetingRef.current) {
      chatSocketClient.getSocket()?.emit(MEETING_EVENTS.TOGGLE_AUDIO, {
        meetingId,
        isOn: audioTrack.enabled,
      });
    }
  }, [meetingId]);

  const toggleVideo = useCallback(() => {
    if (!meetingId) return;
    if (meetingType === "voice") {
      setConnectionError("Voice calls do not support video.");
      return;
    }

    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    isVideoOnRef.current = videoTrack.enabled;
    setIsVideoOn(videoTrack.enabled);

    if (hasJoinedMeetingRef.current) {
      chatSocketClient.getSocket()?.emit(MEETING_EVENTS.TOGGLE_VIDEO, {
        meetingId,
        isOn: videoTrack.enabled,
      });
    }
  }, [meetingId, meetingType]);

  const leave = useCallback(() => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;

    if (meetingId) {
      chatSocketClient.getSocket()?.emit(MEETING_EVENTS.LEAVE, { meetingId });
    }

    cleanupAllMeetingResources();
  }, [cleanupAllMeetingResources, meetingId]);

  const endForAll = useCallback(() => {
    if (!meetingId) return;

    chatSocketClient.getSocket()?.emit(MEETING_EVENTS.END, { meetingId });
  }, [meetingId]);

  useEffect(() => {
    if (!meetingType || !userId) return;

    let isMounted = true;

    const init = async () => {
      try {
        const stream = await acquireMedia();
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (error) {
        console.error("[useWebRTC] Could not initialize media", error);
        if (isMounted) {
          setConnectionError("Could not initialize the meeting.");
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
      cleanupAllMeetingResources();
    };
  }, [acquireMedia, cleanupAllMeetingResources, meetingType, userId]);

  useEffect(() => {
    if (!meetingId || !userId || !meetingType) {
      setIsConnecting(false);
      if (shouldConnect) {
        setConnectionError(
          "Meeting cannot start because the current meeting context is not available.",
        );
      }
      return;
    }

    if (!shouldConnect) {
      setIsConnecting(false);
      return;
    }

    if (!localStreamRef.current) {
      setIsConnecting(true);
      return;
    }

    let isMounted = true;
    hasLeftRef.current = false;
    setIsConnecting(true);
    setConnectionError(null);
    setCapacityWarning(false);

    const socket = chatSocketClient.connect();
    if (!socket) {
      setIsConnecting(false);
      setConnectionError("Meeting socket is not available in this browser.");
      return;
    }

    const emitLocalMediaState = () => {
      socket.emit(MEETING_EVENTS.TOGGLE_AUDIO, {
        meetingId,
        isOn: isAudioOnRef.current,
      });

      socket.emit(MEETING_EVENTS.TOGGLE_VIDEO, {
        meetingId,
        isOn: isVideoOnRef.current,
      });
    };

    const syncParticipants = (
      participants: MeetingUserPayload["participants"],
    ) => {
      if (!participants) return;

      setRemoteStreams((previous) => {
        const next = new Map(previous);

        participants.forEach((participant) => {
          if (participant.userId === userId) return;

          const current = next.get(participant.userId);
          const displayName = participant.displayName || participant.name;
          next.set(participant.userId, {
            userId: participant.userId,
            stream: current?.stream ?? null,
            isAudioOn:
              getPeerAudioState(participant) ?? current?.isAudioOn ?? true,
            isVideoOn:
              participant.isVideoOn ?? current?.isVideoOn ?? meetingType === "video",
            displayName: displayName ?? current?.displayName,
          });
        });

        Array.from(next.keys()).forEach((peerId) => {
          if (!participants.some((participant) => participant.userId === peerId)) {
            next.delete(peerId);
          }
        });

        return next;
      });
    };

    const handleUserJoined = (envelope: SocketEnvelope<MeetingUserPayload>) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;
      if (data.userId === userId) return;

      syncParticipants(data.participants);

      const displayName = getPeerDisplayName(data);
      toast.success(`${displayName || getPeerFallbackName(data.userId)} joined the meeting.`, {
        position: "bottom-right", style: {
          marginBottom: "4rem",
        }
      });
      setRemoteStreams((previous) => {
        const next = new Map(previous);
        const current = next.get(data.userId);
        next.set(data.userId, {
          userId: data.userId,
          stream: current?.stream ?? null,
          isAudioOn: getPeerAudioState(data) ?? current?.isAudioOn ?? true,
          isVideoOn:
            data.isVideoOn ?? current?.isVideoOn ?? data.type === "video",
          displayName: displayName ?? current?.displayName,
        });
        return next;
      });

      void createAndSendOffer(data.userId);
    };

    const handleUserLeft = (envelope: SocketEnvelope<MeetingUserPayload>) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;
      if (data.userId === userId) return;

      syncParticipants(data.participants);
      // bottom right
      toast(`${getPeerDisplayName(data) || getPeerFallbackName(data.userId)} left the meeting.`, { position: "bottom-right", style: {
          marginBottom: "4rem",
        } });

      const pc = peerConnections.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.userId);
      }

      setRemoteStreams((previous) => {
        const next = new Map(previous);
        next.delete(data.userId);
        return next;
      });
    };

    const handleMeetingEnded = (
      envelope: SocketEnvelope<MeetingEndedPayload>,
    ) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId !== meetingId) return;

      cleanupAllMeetingResources();
      setConnectionError("This meeting has ended.");
    };

    const handleCapacityWarning = () => {
      setCapacityWarning(true);
    };

    const handleAudioChanged = (
      envelope: SocketEnvelope<MeetingTogglePayload>,
    ) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;

      setRemoteStreams((previous) => {
        const next = new Map(previous);
        const peer = next.get(data.userId);
        if (peer) next.set(data.userId, { ...peer, isAudioOn: data.isOn });
        return next;
      });
    };

    const handleVideoChanged = (
      envelope: SocketEnvelope<MeetingTogglePayload>,
    ) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;

      setRemoteStreams((previous) => {
        const next = new Map(previous);
        const peer = next.get(data.userId);
        if (peer) next.set(data.userId, { ...peer, isVideoOn: data.isOn });
        return next;
      });
    };

    const handleOffer = async (envelope: SocketEnvelope<RtcSessionPayload>) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;
      if (!data.senderId || data.senderId === userId) return;

      try {
        const pc = createPeerConnection(data.senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await processPendingIce(data.senderId, pc);

        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: meetingType === "video",
        });
        await pc.setLocalDescription(answer);

        socket.emit(RTC_EVENTS.ANSWER, {
          meetingId,
          targetUserId: data.senderId,
          sdp: answer,
          displayName: currentUserName,
        });

        if (data.displayName) {
          setRemoteStreams((previous) => {
            const next = new Map(previous);
            const peer = next.get(data.senderId);
            if (peer)
              next.set(data.senderId, {
                ...peer,
                displayName: data.displayName,
              });
            return next;
          });
        }
      } catch (error) {
        console.error("[useWebRTC] Could not answer WebRTC offer", error);
        setConnectionError("Could not answer a meeting connection request.");
      }
    };

    const handleAnswer = async (
      envelope: SocketEnvelope<RtcSessionPayload>,
    ) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;
      if (!data.senderId || data.senderId === userId) return;

      const pc = peerConnections.current.get(data.senderId);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await processPendingIce(data.senderId, pc);

        if (data.displayName) {
          setRemoteStreams((previous) => {
            const next = new Map(previous);
            const peer = next.get(data.senderId);
            if (peer)
              next.set(data.senderId, {
                ...peer,
                displayName: data.displayName,
              });
            return next;
          });
        }
      } catch (error) {
        console.error("[useWebRTC] Could not apply WebRTC answer", error);
        setConnectionError("Could not complete the meeting connection.");
      }
    };

    const handleIce = async (envelope: SocketEnvelope<RtcIcePayload>) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;
      if (!data.senderId || data.senderId === userId) return;

      const pc = peerConnections.current.get(data.senderId);

      if (pc?.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.warn("[useWebRTC] Could not add ICE candidate", error);
        }
        return;
      }

      const pending = pendingIceCandidates.current.get(data.senderId) || [];
      pending.push(data.candidate);
      pendingIceCandidates.current.set(data.senderId, pending);
    };

    socket.on(MEETING_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(MEETING_EVENTS.USER_LEFT, handleUserLeft);
    socket.on(MEETING_EVENTS.ENDED, handleMeetingEnded);
    socket.on(MEETING_EVENTS.CAPACITY_WARNING, handleCapacityWarning);
    socket.on(MEETING_EVENTS.USER_AUDIO_CHANGED, handleAudioChanged);
    socket.on(MEETING_EVENTS.USER_VIDEO_CHANGED, handleVideoChanged);
    socket.on(RTC_EVENTS.OFFER, handleOffer);
    socket.on(RTC_EVENTS.ANSWER, handleAnswer);
    socket.on(RTC_EVENTS.ICE, handleIce);

    socket.emit(
      MEETING_EVENTS.JOIN,
      {
        meetingId,
        displayName: currentUserName,
        isAudioOn: isAudioOnRef.current,
        isVideoOn: isVideoOnRef.current,
      },
      (response?: { 
        ok?: boolean; 
        message?: string;
        roomFull?: boolean;
        isFirstInTheCall?: boolean;
        membersOnCall?: number;
        maxParticipants?: number;
        existingUsers?: string[];
        participants?: Array<{userId: string; isAudioOn?: boolean; isVideoOn?: boolean}>;
      }) => {
        if (!isMounted) return;

        if (response?.roomFull) {
          const limit = response.maxParticipants ?? response.membersOnCall ?? 'the maximum';
          setConnectionError(`Room is full. Maximum ${limit} participants allowed.`);
          setIsConnecting(false);
          return;
        }

        if (!response || response.ok !== false) {
          hasJoinedMeetingRef.current = true;
          emitLocalMediaState();
          setIsConnecting(false);

          if (response?.participants) {
            setRemoteStreams((previous) => {
              const next = new Map(previous);
              response.participants!.forEach((p) => {
                if (String(p.userId) !== userId) {
                  const existing = next.get(String(p.userId));
                  next.set(String(p.userId), {
                    userId: String(p.userId),
                    stream: existing?.stream ?? null,
                    isAudioOn: p.isAudioOn ?? existing?.isAudioOn ?? true,
                    isVideoOn: p.isVideoOn ?? existing?.isVideoOn ?? meetingType === "video",
                    displayName: existing?.displayName,
                  });
                }
              });
              return next;
            });
          }

          const max = response?.maxParticipants;
          const current = response?.membersOnCall;
          if (max !== undefined && current !== undefined && current >= max) {
            setCapacityWarning(true);
          }
          return;
        }

        setConnectionError(response.message || "Could not join the meeting.");
        setIsConnecting(false);
      },
    );

    return () => {
      isMounted = false;

      socket.off(MEETING_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(MEETING_EVENTS.USER_LEFT, handleUserLeft);
      socket.off(MEETING_EVENTS.ENDED, handleMeetingEnded);
      socket.off(MEETING_EVENTS.CAPACITY_WARNING, handleCapacityWarning);
      socket.off(MEETING_EVENTS.USER_AUDIO_CHANGED, handleAudioChanged);
      socket.off(MEETING_EVENTS.USER_VIDEO_CHANGED, handleVideoChanged);
      socket.off(RTC_EVENTS.OFFER, handleOffer);
      socket.off(RTC_EVENTS.ANSWER, handleAnswer);
      socket.off(RTC_EVENTS.ICE, handleIce);

      cleanupPeerConnections();
    };
  }, [
    meetingId,
    meetingType,
    userId,
    currentUserName,
    createAndSendOffer,
    createPeerConnection,
    localStream,
    processPendingIce,
    shouldConnect,
    cleanupAllMeetingResources,
    cleanupPeerConnections,
  ]);

  return {
    localStream,
    remoteStreams,
    isAudioOn,
    isVideoOn,
    isConnecting,
    connectionError,
    capacityWarning,
    mediaStatus,
    toggleAudio,
    toggleVideo,
    leave,
    endForAll,
  };
}
