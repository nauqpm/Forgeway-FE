import React from 'react';
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, LogOut, Users, UsersRound } from 'lucide-react';

import { MeetingType } from '@/modules/client/chat/types/webrtc.types';

interface MeetingControlsProps {
  isAudioOn: boolean;
  isVideoOn: boolean;
  meetingType: MeetingType;
  participantCount: number;
  isParticipantsOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
  onEndForAll?: () => void;
  isEndingMeeting?: boolean;
}

export default function MeetingControls({
  isAudioOn,
  isVideoOn,
  meetingType,
  participantCount,
  isParticipantsOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleParticipants,
  onLeave,
  onEndForAll,
  isEndingMeeting = false,
}: MeetingControlsProps) {
  return (
    <div className="h-20 bg-[#1A1B26] border-t border-[#2A2B3D] flex items-center justify-between px-8 shrink-0 shadow-2xl z-50">
      
      {/* Left section - placeholder for meeting info/time if needed */}
      <div className="flex-1"></div>

      {/* Center section - Main controls */}
      <div className="flex items-center gap-4 flex-1 justify-center">
        

        <button
          onClick={onToggleParticipants}
          className={`md:hidden w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
            isParticipantsOpen
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-[#2A2B3D] hover:bg-[#3A3B4D] text-white'
          }`}
          title={isParticipantsOpen ? 'Hide participants' : 'Show participants'}
        >
          {isParticipantsOpen ? <UsersRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
        </button>

        <button
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
            isAudioOn 
              ? 'bg-[#2A2B3D] hover:bg-[#3A3B4D] text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isAudioOn ? "Turn off microphone" : "Turn on microphone"}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {meetingType !== 'voice' && (
          <button
            onClick={onToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
              isVideoOn 
                ? 'bg-[#2A2B3D] hover:bg-[#3A3B4D] text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        )}

        <div className="w-px h-8 bg-[#2A2B3D] mx-2"></div>

        <button
          onClick={onLeave}
          className="px-6 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2 transition-all shadow-md"
          title="Leave meeting"
        >
          <LogOut className="w-5 h-5" />
          Leave
        </button>

        <button
          onClick={onToggleParticipants}
          className={`hidden md:flex h-12 items-center gap-2 rounded-full border px-4 font-medium transition-all shadow-md ${
            isParticipantsOpen
              ? 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15'
              : 'border-[#2A2B3D] bg-[#2A2B3D] text-white hover:bg-[#3A3B4D]'
          }`}
          title={isParticipantsOpen ? 'Hide participants' : 'Show participants'}
        >
          {isParticipantsOpen ? <UsersRound className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          <span>People</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{participantCount}</span>
        </button>
      </div>

      {/* Right section - Admin controls */}
      <div className="flex-1 flex justify-end">
        {onEndForAll && (
          <button
          onClick={onEndForAll}
            disabled={isEndingMeeting}
            className="px-4 py-2 rounded-lg bg-transparent hover:bg-red-500/10 text-red-500 border border-red-500/20 hover:border-red-500/50 transition-all font-medium flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            title="End meeting for everyone"
          >
            {isEndingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
            {isEndingMeeting ? 'Ending...' : 'End for all'}
          </button>
        )}
      </div>

    </div>
  );
}
