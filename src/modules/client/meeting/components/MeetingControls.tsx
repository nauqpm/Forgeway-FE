import React from 'react';
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, LogOut } from 'lucide-react';

import { MeetingType } from '@/modules/client/chat/types/webrtc.types';

interface MeetingControlsProps {
  isAudioOn: boolean;
  isVideoOn: boolean;
  meetingType: MeetingType;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  onEndForAll?: () => void;
  isEndingMeeting?: boolean;
}

export default function MeetingControls({
  isAudioOn,
  isVideoOn,
  meetingType,
  onToggleAudio,
  onToggleVideo,
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
