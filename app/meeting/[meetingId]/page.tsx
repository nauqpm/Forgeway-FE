'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/modules/auth/shared/stores/authStore';
import { useWebRTC } from '@/modules/client/chat/hooks/useWebRTC';
import { getMeetingByIdAPI } from '@/modules/client/chat/services/meeting.api';
import { MeetingType } from '@/modules/client/chat/types/webrtc.types';
import VideoTile from '@/modules/client/meeting/components/VideoTile';
import MeetingControls from '@/modules/client/meeting/components/MeetingControls';
import MeetingParticipantsSidebar from '@/modules/client/meeting/components/MeetingParticipantsSidebar';
import meetingParticipants from '@/modules/client/meeting/utils/meetingParticipants';
import { Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.meetingId as string;
  const router = useRouter();
  
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.fullName || currentUser?.email || 'User';
  
  const [meetingCreatorId, setMeetingCreatorId] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [isRoomFull, setIsRoomFull] = useState<boolean>(false);
  const [isAlreadyParticipant, setIsAlreadyParticipant] = useState<boolean>(false);
  const [isMeetingLoading, setIsMeetingLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const hasHandledMeetingEndedRef = useRef(false);

  // Initialize WebRTC Hook
  const {
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
  } = useWebRTC(meetingId, currentUserId, meetingType ?? undefined, currentUserName, hasJoined);

  // Fetch meeting details initially to check if we are the creator
  useEffect(() => {
    if (!meetingId) return;

    setIsMeetingLoading(true);
    getMeetingByIdAPI(meetingId)
      .then((meeting) => {
        if (!meeting || meeting.status === 'ended') {
          setInitError('Meeting not found or has ended.');
          return;
        }

        setMeetingCreatorId(meeting.createdBy);
        setMeetingType(meeting.type ?? 'video');
        
        const participantCount = meeting.participants.length;
        const maxAllowed = meeting.maxParticipants ?? 6;
        const isParticipant = meeting.participants.some(p => String(p.userId) === String(currentUserId));
        
        setIsAlreadyParticipant(isParticipant);
        setIsRoomFull(!isParticipant && participantCount >= maxAllowed);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Failed to fetch meeting details.';
        setInitError(message);
      })
      .finally(() => setIsMeetingLoading(false));
  }, [meetingId]);

  const leaveMeetingPage = useCallback(() => {
    window.close();

    window.setTimeout(() => {
      if (!document.hidden) {
        router.push('/chat');
      }
    }, 150);
  }, [router]);

  const handleLeave = () => {
    leave();
    leaveMeetingPage();
  };

  useEffect(() => {
    if (connectionError !== 'This meeting has ended.' || hasHandledMeetingEndedRef.current) return;

    hasHandledMeetingEndedRef.current = true;
    toast.error('This meeting has ended.');
    window.setTimeout(leaveMeetingPage, 800);
  }, [connectionError, leaveMeetingPage]);

  const handleEndForAll = () => {
    if (confirm("Are you sure you want to end this meeting for everyone?")) {
      setIsEndingMeeting(true);
      endForAll();
      toast.success('Ending meeting for everyone.');
      window.setTimeout(leaveMeetingPage, 250);
    }
  };

  const participants = meetingParticipants.buildMeetingParticipants({
    currentUserName,
    isLocalAudioOn: isAudioOn,
    isLocalVideoOn: isVideoOn,
    remoteStreams,
  });

  if (initError) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center text-white">
        <div className="bg-[#1A1B26] p-8 rounded-xl border border-[#2A2B3D] flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-[#A0AEC0] mb-6">{initError}</p>
          <button 
            onClick={leaveMeetingPage}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Leave Meeting
          </button>
        </div>
      </div>
    );
  }

  if (!currentUserId || isMeetingLoading || (hasJoined && isConnecting)) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-[#A0AEC0] font-medium text-lg">
          {isMeetingLoading ? 'Loading meeting...' : `Connecting to ${meetingType === 'voice' ? 'voice call' : 'video meeting'}...`}
        </p>
      </div>
    );
  }

  // Lobby / Launcher UI
  if (!hasJoined && meetingType) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center text-white p-4 font-sans">
        <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 bg-[#1A1B26] p-8 rounded-2xl border border-[#2A2B3D] shadow-2xl">
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 text-[#E5E7EB]">Ready to join?</h2>
            
            <div className="w-full aspect-video bg-[#0B0C10] rounded-xl overflow-hidden shadow-inner border border-[#2A2B3D]/50 relative mb-6">
              <VideoTile
                stream={localStream}
                isAudioOn={isAudioOn}
                isVideoOn={isVideoOn}
                name={currentUserName}
                isLocal={true}
              />
              {(mediaStatus === 'audio-only' || mediaStatus === 'unavailable') && (
                <div className="absolute inset-x-0 bottom-0 bg-amber-500/90 text-amber-950 p-2 text-sm font-medium flex items-center justify-center gap-2 z-20 backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Camera is unavailable or in use by another application
                </div>
              )}
              {mediaStatus === 'video-only' && (
                <div className="absolute inset-x-0 bottom-0 bg-amber-500/90 text-amber-950 p-2 text-sm font-medium flex items-center justify-center gap-2 z-20 backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Microphone is unavailable or in use by another application
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-all ${isAudioOn ? 'bg-[#2A2B3D] hover:bg-[#3A3B4D] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                {isAudioOn ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.172 3.172a4 4 0 015.656 0L19 13M5 5l14 14m-4-4v-1a3 3 0 00-3-3m-3-3V5a3 3 0 116 0v6a3 3 0 01-.17 1M11 11.293l-4 4m0 0a7 7 0 0010 0" /></svg>
                )}
              </button>
              
              {meetingType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-[#2A2B3D] hover:bg-[#3A3B4D] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  {isVideoOn ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" /></svg>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-1/3 flex flex-col justify-center items-center md:items-start border-t md:border-t-0 md:border-l border-[#2A2B3D] pt-8 md:pt-0 md:pl-8">
            <h3 className="text-xl font-medium mb-2 text-[#E5E7EB]">{meetingType === 'video' ? 'Video Meeting' : 'Voice Call'}</h3>
            <p className="text-[#A0AEC0] text-sm mb-8 text-center md:text-left">
              Make sure your camera and microphone are working before joining the meeting.
            </p>
            
            <button
              onClick={() => setHasJoined(true)}
              disabled={isRoomFull}
              className={`w-full py-3 px-6 text-white rounded-xl font-bold shadow-lg transition-all transform ${isRoomFull ? 'bg-gray-600 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {isRoomFull ? 'Room is Full' : isAlreadyParticipant ? 'Rejoin Now' : 'Join Now'}
            </button>
            <button
              onClick={leaveMeetingPage}
              className="w-full mt-4 py-3 px-6 bg-transparent hover:bg-[#2A2B3D] text-[#A0AEC0] hover:text-white rounded-xl font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic grid columns based on total participants
  const totalParticipants = 1 + remoteStreams.size;
  const gridClass = totalParticipants === 1 
    ? 'grid-cols-1' 
    : totalParticipants === 2 
      ? 'grid-cols-1 md:grid-cols-2'
      : totalParticipants <= 4 
        ? 'grid-cols-2'
        : 'grid-cols-2 md:grid-cols-3';

  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col h-screen overflow-hidden text-white font-sans">
      {/* Top Warning Banner if capacity exceeded (D-12) */}
      {capacityWarning && (
        <div className="h-10 shrink-0 bg-amber-500/90 text-amber-950 flex items-center justify-center px-4 font-medium text-sm z-50 shadow-md backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 mr-2" />
          This meeting has reached the recommended capacity of 6 people. Performance may be degraded.
        </div>
      )}

      {(connectionError || mediaStatus === 'audio-only' || mediaStatus === 'video-only' || mediaStatus === 'unavailable') && (
        <div className="shrink-0 bg-[#111827] border-b border-[#2A2B3D] px-4 py-2 text-sm text-[#E5E7EB] flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>
            {connectionError ||
              (mediaStatus === 'audio-only'
                ? 'Camera is unavailable. You are connected with microphone only.'
                : mediaStatus === 'video-only'
                ? 'Microphone is unavailable. You are connected with camera only.'
                : 'Camera and microphone are unavailable. You can stay in the meeting without media.')}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <div className="flex-1 min-w-0 p-4 md:p-8 flex items-center justify-center">
          <div className={`w-full h-full max-w-7xl mx-auto grid gap-4 ${gridClass} auto-rows-fr`}>
            
            {/* Local User */}
            <div className="w-full h-full min-h-[200px]">
              <VideoTile
                stream={localStream}
                isAudioOn={isAudioOn}
                isVideoOn={isVideoOn}
                name="You"
                isLocal={true}
              />
            </div>

            {/* Remote Users */}
            {Array.from(remoteStreams.values()).map((peer) => (
              <div key={peer.userId} className="w-full h-full min-h-[200px]">
                <VideoTile
                  stream={peer.stream}
                  isAudioOn={peer.isAudioOn}
                  isVideoOn={peer.isVideoOn}
                  name={peer.displayName || `Participant ${peer.userId.slice(-4)}`}
                  isLocal={false}
                />
              </div>
            ))}

          </div>
        </div>

        <MeetingParticipantsSidebar
          participants={participants}
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
        />
      </div>

      {/* Controls Area */}
      <MeetingControls
        isAudioOn={isAudioOn}
        isVideoOn={isVideoOn}
        meetingType={meetingType ?? 'video'}
        participantCount={participants.length}
        isParticipantsOpen={isParticipantsOpen}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleParticipants={() => setIsParticipantsOpen((current) => !current)}
        onLeave={handleLeave}
        onEndForAll={currentUserId === meetingCreatorId ? handleEndForAll : undefined}
        isEndingMeeting={isEndingMeeting}
      />
    </div>
  );
}
