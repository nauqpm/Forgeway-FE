import React from 'react';
import { Mic, MicOff, Video, VideoOff, Users, ChevronRight } from 'lucide-react';

type Participant = {
  id: string;
  name: string;
  subtitle?: string;
  isLocal: boolean;
  isAudioOn: boolean;
  isVideoOn: boolean;
  initials: string;
};

interface MeetingParticipantsSidebarProps {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
}

const statusText = (participant: Participant) => {
  if (participant.isLocal) {
    return participant.subtitle ? participant.subtitle : 'You are here';
  }

  if (!participant.isAudioOn && !participant.isVideoOn) {
    return 'Audio and camera off';
  }

  if (!participant.isAudioOn) {
    return 'Microphone off';
  }

  if (!participant.isVideoOn) {
    return 'Camera off';
  }

  return 'Connected';
};

const avatarClass = (participant: Participant) =>
  participant.isLocal
    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
    : 'bg-gradient-to-br from-[#3A3B4D] to-[#262936]';

export default function MeetingParticipantsSidebar({
  participants,
  isOpen,
  onClose,
}: MeetingParticipantsSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close participants sidebar"
        onClick={onClose}
        className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[1px] md:hidden"
      />

      <aside className="fixed right-0 top-0 z-30 flex h-full w-[min(88vw,20rem)] flex-col border-l border-[#2A2B3D] bg-[#111318] shadow-2xl md:relative md:z-auto md:w-80 md:shrink-0">
        <div className="flex items-start justify-between gap-4 border-b border-[#2A2B3D] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[#E5E7EB]">
              <Users className="h-5 w-5 text-[#60A5FA]" />
              <h2 className="text-sm font-semibold">People in meeting</h2>
            </div>
            <p className="mt-1 text-xs text-[#A0AEC0]">
              {participants.length} participant{participants.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#2A2B3D] p-2 text-[#A0AEC0] transition-colors hover:bg-[#1A1B26] hover:text-white"
            title="Hide participants"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {participants.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A2B3D] px-4 py-10 text-center">
              <Users className="h-10 w-10 text-[#4B5563]" />
              <p className="mt-4 text-sm font-medium text-[#E5E7EB]">No one else is here yet</p>
              <p className="mt-1 text-xs text-[#A0AEC0]">People who join the meeting will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#2A2B3D] bg-[#1A1B26] px-3 py-3"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarClass(
                      participant,
                    )}`}
                  >
                    {participant.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {participant.name}
                      </p>
                      {participant.isLocal && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                          You
                        </span>
                      )}
                    </div>
                    {participant.subtitle ? (
                      <p className="truncate text-xs text-[#A0AEC0]">
                        {participant.subtitle}
                      </p>
                    ) : (
                      <p className="text-xs text-[#A0AEC0]">{statusText(participant)}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-[#A0AEC0]">
                    {participant.isAudioOn ? (
                      <Mic className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <MicOff className="h-4 w-4 text-red-300" />
                    )}
                    {participant.isVideoOn ? (
                      <Video className="h-4 w-4 text-emerald-300" />
                    ) : (
                      <VideoOff className="h-4 w-4 text-red-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
