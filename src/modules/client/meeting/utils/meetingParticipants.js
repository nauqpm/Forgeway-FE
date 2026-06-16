const getInitials = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "??";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getRemoteName = (peer) => {
  return (
    peer?.displayName?.trim() ||
    peer?.name?.trim() ||
    `Participant ${String(peer?.userId || "").slice(-4) || "----"}`
  );
};

const buildMeetingParticipants = ({
  currentUserName,
  isLocalAudioOn = true,
  isLocalVideoOn = true,
  remoteStreams,
}) => {
  const participants = [
    {
      id: "local-user",
      name: "You",
      subtitle: currentUserName?.trim() || "",
      isLocal: true,
      isAudioOn: isLocalAudioOn,
      isVideoOn: isLocalVideoOn,
      initials: getInitials(currentUserName || "You"),
    },
  ];

  if (remoteStreams instanceof Map) {
    remoteStreams.forEach((peer) => {
      const name = getRemoteName(peer);
      participants.push({
        id: peer.userId,
        name,
        subtitle: peer.displayName?.trim() && peer.displayName.trim() !== name ? peer.displayName.trim() : "",
        isLocal: false,
        isAudioOn: peer.isAudioOn,
        isVideoOn: peer.isVideoOn,
        initials: getInitials(name),
      });
    });
  }

  return participants;
};

module.exports = {
  buildMeetingParticipants,
  getInitials,
  getRemoteName,
};

module.exports.default = module.exports;
