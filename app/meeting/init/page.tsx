'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createMeetingAPI, getActiveMeetingAPI } from '@/modules/client/chat/services/meeting.api';
import { MeetingType } from '@/modules/client/chat/types/webrtc.types';
import toast from 'react-hot-toast';

export default function MeetingInitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channel');
  const type = (searchParams.get('type') as MeetingType) || 'video';
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (!channelId) {
      toast.error('Missing channel information');
      return;
    }

    const initMeeting = async () => {
      try {
        let meeting = await getActiveMeetingAPI(channelId);

        if (!meeting) {
          meeting = await createMeetingAPI(channelId, type);
        }

        if (!meeting?._id) {
          toast.error('Could not start the meeting.');
          return;
        }

        // Redirect to the actual meeting page
        router.replace(`/meeting/${meeting._id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not start the meeting.';
        toast.error(message);
      }
    };

    void initMeeting();
  }, [channelId, type, router]);

  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <p className="text-[#A0AEC0] font-medium text-lg">Preparing your meeting...</p>
    </div>
  );
}
