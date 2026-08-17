"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProfilePage } from "@/modules/profile/components/ProfilePage";

export default function Page() {
  const params = useParams();
  const userId = params?.userId as string | undefined;

  return <ProfilePage userId={userId} />;
}
