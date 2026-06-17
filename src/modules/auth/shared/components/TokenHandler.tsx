"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";

export default function TokenHandler() {
  const searchParams = useSearchParams();
  const { loginWithSsoToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Save token to localStorage and update state
      loginWithSsoToken(token);

      // Remove token from URL to avoid exposing sensitive information
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, loginWithSsoToken]);

  return null; // This component does not render anything
}
