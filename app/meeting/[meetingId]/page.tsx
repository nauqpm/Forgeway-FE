'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { MeetingRoomClient } from '@/modules/client/chat/components/MeetingRoomClient';

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.meetingId as string;

  if (!meetingId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Invalid Meeting ID</p>
      </div>
    );
  }

  return (
    <main className="w-full h-screen bg-black">
      <MeetingRoomClient meetingId={meetingId} />
    </main>
  );
}
