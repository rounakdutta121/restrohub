"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useOutlet } from "@/hooks/use-outlet";

type LivePayload = {
  opsVersion: number;
  changed: boolean;
  unread?: number;
};

type LiveContextValue = {
  opsVersion: number;
  unread: number;
  /** Monotonic tick — increments when opsVersion changes after baseline */
  revision: number;
};

const LiveContext = createContext<LiveContextValue>({
  opsVersion: 0,
  unread: 0,
  revision: 0,
});

const POLL_MS = 2500;

/**
 * One live pulse for the whole dashboard (selected outlet).
 * Pages subscribe via useOutletLive; bell reads unread from context.
 */
export function OutletLiveProvider({ children }: { children: ReactNode }) {
  const { outlet } = useOutlet();
  const outletId = outlet?.id;
  const [opsVersion, setOpsVersion] = useState(0);
  const [unread, setUnread] = useState(0);
  const [revision, setRevision] = useState(0);
  const versionRef = useRef(0);
  const primedRef = useRef(false);

  const poll = useCallback(async () => {
    if (!outletId) return;
    if (typeof document !== "undefined" && document.hidden) return;

    try {
      const res = await fetch(
        `/api/outlets/${outletId}/live?v=${versionRef.current}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text) as LivePayload;
      if (typeof data.unread === "number") setUnread(data.unread);

      const serverV = Number(data.opsVersion) || 0;
      const moved = serverV !== versionRef.current;
      versionRef.current = serverV;
      setOpsVersion(serverV);

      if (!primedRef.current) {
        primedRef.current = true;
        return;
      }

      if (moved || data.changed) {
        setRevision((r) => r + 1);
      }
    } catch {
      /* ignore transient network errors */
    }
  }, [outletId]);

  useEffect(() => {
    versionRef.current = 0;
    primedRef.current = false;
    setOpsVersion(0);
    setRevision(0);
    setUnread(0);
    if (!outletId) return;

    poll();
    const id = setInterval(poll, POLL_MS);

    function onVisible() {
      if (!document.hidden) poll();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [outletId, poll]);

  return (
    <LiveContext.Provider value={{ opsVersion, unread, revision }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLivePulse() {
  return useContext(LiveContext);
}

/**
 * Refetch when the selected outlet's ops version advances.
 * Safe to call from many pages — polling happens once in OutletLiveProvider.
 */
export function useOutletLive(
  outletId: string | undefined | null,
  onChange?: (info: { opsVersion: number; unread?: number }) => void
) {
  const { outlet } = useOutlet();
  const { opsVersion, unread, revision } = useLivePulse();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastRevision = useRef(0);

  useEffect(() => {
    lastRevision.current = 0;
  }, [outletId]);

  useEffect(() => {
    if (!outletId || outletId !== outlet?.id) return;
    if (revision === 0) return;
    if (revision === lastRevision.current) return;
    lastRevision.current = revision;
    onChangeRef.current?.({ opsVersion, unread });
  }, [revision, outletId, outlet?.id, opsVersion, unread]);

  return { opsVersion, unread, revision };
}
