"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function TokenHandler() {
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Lưu token vào localStorage và cập nhật state
      login(token);

      // Xóa token khỏi URL để tránh lộ thông tin nhạy cảm
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, login]);

  return null; // Component này không render gì cả
}
