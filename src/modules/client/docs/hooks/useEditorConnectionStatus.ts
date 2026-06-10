// Hook quản lý trạng thái kết nối của editor tài liệu với server thông qua realtime socket,
// nó theo dõi trạng thái kết nối và cập nhật giao diện người dùng tương ứng, ví dụ hiển thị trạng thái "Đang kết nối...", "Đã kết nối", "Mất kết nối" hoặc "Lỗi kết nối" dựa trên trạng thái thực tế của socket.
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
