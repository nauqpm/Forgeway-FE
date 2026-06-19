'use client';

import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  PreJoin,
  LocalUserChoices,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  getMeetingConnectionDetailsAPI,
  LivekitConnectionDetails,
} from '../services/meeting.api';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MeetingRoomClientProps {
  meetingId: string;
  onLeave?: () => void;
}

export const MeetingRoomClient: React.FC<MeetingRoomClientProps> = ({
  meetingId,
  onLeave,
}) => {
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<LivekitConnectionDetails | null>(
    null,
  );
  const [isConnecting, setIsConnecting] = useState(false);

  // Once user submits PreJoin form, we fetch token
  useEffect(() => {
    if (preJoinChoices && !connectionDetails && !isConnecting) {
      const connectToRoom = async () => {
        try {
          setIsConnecting(true);
          const details = await getMeetingConnectionDetailsAPI(meetingId);
          setConnectionDetails(details);
        } catch (error) {
          console.error('Failed to get connection details:', error);
          toast.error('Failed to connect to the meeting. Please try again.');
          setPreJoinChoices(null);
        } finally {
          setIsConnecting(false);
        }
      };

      connectToRoom();
    }
  }, [preJoinChoices, meetingId, connectionDetails, isConnecting]);

  if (!preJoinChoices) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-900 text-white p-4">
        <div className="w-full max-w-2xl bg-gray-800 rounded-xl overflow-hidden shadow-2xl p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Join Meeting</h2>
          <PreJoin
            onSubmit={(choices) => setPreJoinChoices(choices)}
            onValidate={(values) => {
              // Can validate username or other things if needed. We already get identity from token.
              return true;
            }}
          />
        </div>
      </div>
    );
  }

  if (isConnecting || !connectionDetails) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-lg">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black" data-lk-theme="default">
      <LiveKitRoom
        serverUrl={connectionDetails.serverUrl}
        token={connectionDetails.participantToken}
        video={preJoinChoices.videoEnabled}
        audio={preJoinChoices.audioEnabled}
        connect={true}
        onDisconnected={() => {
          if (onLeave) {
            onLeave();
          } else {
            // Close the window or navigate away if no onLeave provided
            window.close();
            window.location.href = '/';
          }
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};
