'use client';

import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  LocalUserChoices,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  getMeetingConnectionDetailsAPI,
  LivekitConnectionDetails,
  MeetingApiError,
  endMeetingAPI,
} from '../services/meeting.api';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSessionStore } from '@/modules/auth/shared/stores/authStore';
import { useAuth } from '@/modules/auth/shared/hooks/useAuth';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CustomPreJoin } from './CustomPreJoin';

interface MeetingRoomClientProps {
  meetingId: string;
  onLeave?: () => void;
}

export const MeetingRoomClient: React.FC<MeetingRoomClientProps> = ({
  meetingId,
  onLeave,
}) => {
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<LivekitConnectionDetails | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  
  const userDisplayName = user?.fullName || user?.email || 'Guest';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [isInitialized, isLoading, isAuthenticated, router, pathname, searchParams]);
  useEffect(() => {
    if (preJoinChoices && !connectionDetails && !isConnecting) {
      const connectToRoom = async () => {
        try {
          setIsConnecting(true);
          const details = await getMeetingConnectionDetailsAPI(meetingId, userDisplayName);
          setConnectionDetails(details);
        } catch (error) {
          console.error('Failed to get connection details:', error);
          if (error instanceof MeetingApiError && error.status === 401) {
            useSessionStore.getState().openSessionExpiredModal();
            return;
          }
          toast.error('Failed to connect to the meeting. Please try again.');
          setPreJoinChoices(null);
        } finally {
          setIsConnecting(false);
        }
      };

      connectToRoom();
    }
  }, [preJoinChoices, meetingId, connectionDetails, isConnecting, userDisplayName]);

  const handleEndMeeting = async () => {
    if (!window.confirm('Are you sure you want to end the meeting for everyone?')) return;
    try {
      setIsEnding(true);
      await endMeetingAPI(meetingId);
      toast.success('Meeting ended for all participants.');
      if (onLeave) onLeave();
      else {
        window.close();
        window.location.href = '/';
      }
    } catch (err) {
      toast.error('Failed to end meeting. You may not have permission.');
    } finally {
      setIsEnding(false);
    }
  };

  if (!isInitialized || isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!preJoinChoices) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-900 text-white p-4">
        <CustomPreJoin 
          userDisplayName={userDisplayName} 
          onSubmit={(choices) => setPreJoinChoices(choices)} 
        />
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

  const showEndMeeting = connectionDetails?.canEndMeeting === true;

  return (
    <div className="h-screen w-full bg-black relative" data-lk-theme="default">
      {showEndMeeting && (
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-sm transition-colors flex items-center gap-2 shadow-lg"
          >
            {isEnding && <Loader2 className="w-4 h-4 animate-spin" />}
            End Meeting for All
          </button>
        </div>
      )}
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
