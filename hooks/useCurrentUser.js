"use client";

import { useSession } from "next-auth/react";

export default function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user || null,
    loading: status === "loading",
    authenticated: status === "authenticated",
  };
}
