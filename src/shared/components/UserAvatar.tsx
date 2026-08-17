import React, { useEffect, useRef, useState } from "react";
import { usePresence } from "@/lib/realtime/hooks/use-presence";
import { formatLastSeen } from "@/lib/utils/presence.utils";

interface UserAvatarProps {
  userId?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  className?: string;
}

export default function UserAvatar({
  userId,
  name,
  email,
  avatarUrl,
  className = "w-8 h-8",
}: UserAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setInView(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "200px" }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Only subscribe to presence if userId exists and the avatar is in view
  const presence = usePresence(inView ? userId : undefined);

  const fallbackInitial = name
    ? name.charAt(0).toUpperCase()
    : email
      ? email.charAt(0).toUpperCase()
      : "U";

  const isOnline = presence?.status === "online";
  const tooltipText = isOnline
    ? "Online"
    : presence?.lastSeenAt
      ? formatLastSeen(presence.lastSeenAt)
      : undefined;



  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 rounded-full ${className}`}
      title={tooltipText}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-white">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name || email || "User Avatar"}
            className="h-full w-full object-cover rounded-full"
          />
        ) : (
          <span className="text-xs font-semibold">{fallbackInitial}</span>
        )}
      </div>

      {userId && (
        <span 
          className={`absolute bottom-0 right-0 block h-[28%] w-[28%] min-h-2.5 min-w-2.5 rounded-full border-[1.5px] border-white dark:border-[#202020] ${isOnline ? 'bg-[#10B981]' : 'bg-[#D1D5DB] dark:bg-[#4B5563]'}`} 
        />
      )}
    </div>
  );
}


