"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chatSocketClient } from "@/lib/socket/chat.client";
import { MEETING_EVENTS, RTC_EVENTS } from "@/lib/socket/socket.events";
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
    "pending" | "ready" | "audio-only" | "unavailable"
  >("pending");

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const hasLeftRef = useRef(false);

  const cleanupConnections = useCallback(() => {
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    pendingIceCandidates.current.clear();

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    setLocalStream(null);
    setRemoteStreams(new Map());
  }, []);

  const acquireMedia = useCallback(async (): Promise<MediaStream> => {
    setMediaStatus("pending");

    try {
      if (meetingType === "voice") {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setIsAudioOn(true);
        setIsVideoOn(false);
        setMediaStatus("ready");
        return stream;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setIsAudioOn(true);
      setIsVideoOn(true);
      setMediaStatus("ready");
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setIsAudioOn(true);
        setIsVideoOn(false);
        setMediaStatus("audio-only");
        return stream;
      } catch {
        setIsAudioOn(false);
        setIsVideoOn(false);
        setMediaStatus("unavailable");
        return new MediaStream();
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
        const offer = await pc.createOffer();
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
    [meetingId, createPeerConnection],
  );

  const toggleAudio = useCallback(() => {
    if (!meetingId) return;

    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioOn(audioTrack.enabled);

    chatSocketClient.getSocket()?.emit(MEETING_EVENTS.TOGGLE_AUDIO, {
      meetingId,
      isOn: audioTrack.enabled,
    });
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
    setIsVideoOn(videoTrack.enabled);

    chatSocketClient.getSocket()?.emit(MEETING_EVENTS.TOGGLE_VIDEO, {
      meetingId,
      isOn: videoTrack.enabled,
    });
  }, [meetingId, meetingType]);

  const leave = useCallback(() => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;

    if (meetingId) {
      chatSocketClient.getSocket()?.emit(MEETING_EVENTS.LEAVE, { meetingId });
    }

    cleanupConnections();
  }, [meetingId, cleanupConnections]);

  const endForAll = useCallback(() => {
    if (!meetingId) return;

    chatSocketClient.getSocket()?.emit(MEETING_EVENTS.END, { meetingId });
  }, [meetingId]);

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

    const handleUserJoined = (envelope: SocketEnvelope<MeetingUserPayload>) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;
      if (data.userId === userId) return;

      const displayName = getPeerDisplayName(data);
      if (displayName) {
        setRemoteStreams((previous) => {
          const next = new Map(previous);
          const current = next.get(data.userId);
          next.set(data.userId, {
            userId: data.userId,
            stream: current?.stream ?? null,
            isAudioOn: current?.isAudioOn ?? true,
            isVideoOn: current?.isVideoOn ?? data.type === "video",
            displayName,
          });
          return next;
        });
      }

      void createAndSendOffer(data.userId);
    };

    const handleUserLeft = (envelope: SocketEnvelope<MeetingUserPayload>) => {
      const data = unwrapSocketPayload(envelope);
      if (data.meetingId && data.meetingId !== meetingId) return;

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

      cleanupConnections();
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

        const answer = await pc.createAnswer();
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

    const init = async () => {
      try {
        const stream = await acquireMedia();
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        if (!shouldConnect) {
          setIsConnecting(false);
          return;
        }

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
          { meetingId, displayName: currentUserName },
          (response?: { ok?: boolean; message?: string }) => {
            if (!response || response.ok !== false) return;
            setConnectionError(
              response.message || "Could not join the meeting.",
            );
          },
        );
      } catch (error) {
        console.error("[useWebRTC] Could not initialize meeting", error);
        setConnectionError("Could not initialize the meeting.");
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    };

    void init();

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

      cleanupConnections();
    };
  }, [
    meetingId,
    meetingType,
    userId,
    acquireMedia,
    cleanupConnections,
    createAndSendOffer,
    createPeerConnection,
    processPendingIce,
    shouldConnect,
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
