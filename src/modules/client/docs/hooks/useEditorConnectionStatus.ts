// Hook managing real-time socket connection status of the document editor with the server,
// monitors connection status and updates UI text appropriately.
"use client";

import { useEffect, useState } from "react";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import type { RealtimeStatusSnapshot } from "@/lib/socket/socket.types";

export function useEditorConnectionStatus() {
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatusSnapshot["status"]>("idle");

  useEffect(() => {
    const unsubStatus = realtimeSocketClient.subscribeStatus((snapshot) => {
      setConnectionStatus(snapshot.status);
    });
    return () => unsubStatus();
  }, []);

  return connectionStatus;
}
