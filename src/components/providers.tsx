"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Bind NextAuth client fetches to the browser's current origin.
 * Avoids CLIENT_FETCH_ERROR when opening via LAN IP (192.168.x.x)
 * while NEXTAUTH_URL is http://localhost:3000.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : undefined;

  return (
    <SessionProvider
      baseUrl={baseUrl}
      basePath="/api/auth"
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
