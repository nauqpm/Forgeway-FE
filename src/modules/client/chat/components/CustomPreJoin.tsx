import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrackToggle,
  MediaDeviceMenu,
  usePreviewTracks,
  usePersistentUserChoices,
  ParticipantPlaceholder,
} from '@livekit/components-react';
import { Track, LocalVideoTrack, LocalAudioTrack, facingModeFromLocalTrack } from 'livekit-client';
import { LocalUserChoices } from '@livekit/components-core';

interface CustomPreJoinProps {
  userDisplayName: string;
  onSubmit: (choices: LocalUserChoices) => void;
}

export const CustomPreJoin: React.FC<CustomPreJoinProps> = ({ userDisplayName, onSubmit }) => {
  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
  } = usePersistentUserChoices({
    defaults: {
      username: userDisplayName,
      videoEnabled: true,
      audioEnabled: true,
    },
    preventSave: false,
    preventLoad: false,
  });

  const [audioEnabled, setAudioEnabled] = useState<boolean>(initialUserChoices.audioEnabled);
  const [videoEnabled, setVideoEnabled] = useState<boolean>(initialUserChoices.videoEnabled);
  const [audioDeviceId, setAudioDeviceId] = useState<string>(initialUserChoices.audioDeviceId);
  const [videoDeviceId, setVideoDeviceId] = useState<string>(initialUserChoices.videoDeviceId);

  useEffect(() => {
    saveAudioInputEnabled(audioEnabled);
  }, [audioEnabled, saveAudioInputEnabled]);

  useEffect(() => {
    saveVideoInputEnabled(videoEnabled);
  }, [videoEnabled, saveVideoInputEnabled]);

  useEffect(() => {
    saveAudioInputDeviceId(audioDeviceId);
  }, [audioDeviceId, saveAudioInputDeviceId]);

  useEffect(() => {
    saveVideoInputDeviceId(videoDeviceId);
  }, [videoDeviceId, saveVideoInputDeviceId]);

  const tracks = usePreviewTracks({
    audio: audioEnabled ? { deviceId: initialUserChoices.audioDeviceId } : false,
    video: videoEnabled ? { deviceId: initialUserChoices.videoDeviceId } : false,
  });

  const videoEl = useRef<HTMLVideoElement>(null);

  const videoTrack = useMemo(
    () => tracks?.filter((track) => track.kind === Track.Kind.Video)[0] as LocalVideoTrack,
    [tracks],
  );

  const audioTrack = useMemo(
    () => tracks?.filter((track) => track.kind === Track.Kind.Audio)[0] as LocalAudioTrack,
    [tracks],
  );

  const facingMode = useMemo(() => {
    if (videoTrack) {
      const { facingMode } = facingModeFromLocalTrack(videoTrack);
      return facingMode;
    }
    return 'undefined';
  }, [videoTrack]);

  useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute();
      videoTrack.attach(videoEl.current);
    }
    return () => {
      videoTrack?.detach();
    };
  }, [videoTrack]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      username: userDisplayName,
      videoEnabled,
      videoDeviceId,
      audioEnabled,
      audioDeviceId,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col p-6 lk-prejoin" data-lk-theme="default">
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        Ready to join, <span className="text-blue-400">{userDisplayName}</span>?
      </h2>

      <div className="lk-video-container mb-6">
        {videoTrack && (
          <video ref={videoEl} width="1280" height="720" data-lk-facing-mode={facingMode} />
        )}
        {(!videoTrack || !videoEnabled) && (
          <div className="lk-camera-off-note">
            <ParticipantPlaceholder />
          </div>
        )}
      </div>

      <div className="lk-button-group-container mb-6">
        <div className="lk-button-group audio">
          <TrackToggle
            initialState={audioEnabled}
            source={Track.Source.Microphone}
            onChange={(enabled) => setAudioEnabled(enabled)}
          >
            Microphone
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              initialSelection={audioDeviceId}
              kind="audioinput"
              disabled={!audioTrack}
              tracks={{ audioinput: audioTrack }}
              onActiveDeviceChange={(_, id) => setAudioDeviceId(id)}
            />
          </div>
        </div>
        <div className="lk-button-group video">
          <TrackToggle
            initialState={videoEnabled}
            source={Track.Source.Camera}
            onChange={(enabled) => setVideoEnabled(enabled)}
          >
            Camera
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              initialSelection={videoDeviceId}
              kind="videoinput"
              disabled={!videoTrack}
              tracks={{ videoinput: videoTrack }}
              onActiveDeviceChange={(_, id) => setVideoDeviceId(id)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-2 border-t border-gray-700 pt-6">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-blue-500/25 transition-all focus:ring-4 focus:ring-blue-500/30"
        >
          Join Meeting
        </button>
      </div>
    </div>
  );
};
