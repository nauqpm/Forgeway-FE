/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');

const { buildMeetingParticipants } = require('./meetingParticipants');

test('buildMeetingParticipants includes local and remote participants', () => {
  const remoteStreams = new Map([
    [
      'user-1234',
      {
        userId: 'user-1234',
        isAudioOn: false,
        isVideoOn: true,
        displayName: 'Linh Tran',
      },
    ],
  ]);

  const participants = buildMeetingParticipants({
    currentUserName: 'Minh Nguyen',
    isLocalAudioOn: false,
    isLocalVideoOn: true,
    remoteStreams,
  });

  assert.equal(participants.length, 2);
  assert.equal(participants[0].name, 'You');
  assert.equal(participants[0].subtitle, 'Minh Nguyen');
  assert.equal(participants[0].isLocal, true);
  assert.equal(participants[0].isAudioOn, false);
  assert.equal(participants[0].isVideoOn, true);
  assert.equal(participants[1].name, 'Linh Tran');
  assert.equal(participants[1].isAudioOn, false);
  assert.equal(participants[1].isVideoOn, true);
});

test('buildMeetingParticipants falls back to a participant label when the remote name is missing', () => {
  const remoteStreams = new Map([
    [
      'user-9999',
      {
        userId: 'user-9999',
        isAudioOn: true,
        isVideoOn: false,
      },
    ],
  ]);

  const participants = buildMeetingParticipants({
    currentUserName: '',
    remoteStreams,
  });

  assert.equal(participants[1].name, 'Participant 9999');
  assert.equal(participants[1].subtitle, '');
});
