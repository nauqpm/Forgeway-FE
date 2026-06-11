import React, { useEffect, useRef } from 'react';
import { MicOff, Mic, VideoOff, User } from 'lucide-react';

interface VideoTileProps {
  stream: MediaStream | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
  name: string;
  isLocal?: boolean;
}

export default function VideoTile({ stream, isAudioOn, isVideoOn, name, isLocal }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-[#1A1B26] rounded-xl overflow-hidden shadow-sm border border-[#2A2B3D] flex items-center justify-center group">
      {/* Avatar Fallback when video is off */}
      {!isVideoOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1B26] z-10">
          <div className="w-24 h-24 rounded-full bg-[#2A2B3D] flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-[#A0AEC0]" />
          </div>
          <span className="text-[#E2E8F0] font-medium text-lg">{name}</span>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent echo
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''} ${!isVideoOn ? 'invisible' : ''}`}
      />

      {/* Overlays */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm font-medium flex items-center gap-2">
          {name} {isLocal && '(You)'}
        </div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors ${isAudioOn ? 'bg-black/50' : 'bg-red-500/80'}`}>
          {isAudioOn ? (
            <Mic className="w-4 h-4 text-white" />
          ) : (
            <MicOff className="w-4 h-4 text-white" />
          )}
        </div>
      </div>
    </div>
  );
}
