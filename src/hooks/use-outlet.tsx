"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useOrganization, type Outlet } from "./use-organization";
import { fetchJson } from "@/lib/fetch-json";

interface OutletContextType {
  outlet: Outlet | null;
  outlets: Outlet[];
  setOutlet: (outlet: Outlet) => void;
  refresh: () => void;
}

const OutletContext = createContext<OutletContextType>({
  outlet: null,
  outlets: [],
  setOutlet: () => {},
  refresh: () => {},
});

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outlet, setOutletState] = useState<Outlet | null>(null);

  const load = useCallback(async () => {
    if (!organization) {
      setOutlets([]);
      setOutletState(null);
      return;
    }
    const data = await fetchJson<Outlet[]>(`/api/workspaces/${organization.id}/outlets`);
    if (Array.isArray(data)) {
      setOutlets(data);
      const saved = localStorage.getItem(`activeOutlet_${organization.id}`);
      const found = saved ? data.find((o) => o.id === saved) : null;
      setOutletState(found || data[0] || null);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  const setOutlet = (o: Outlet) => {
    if (organization) {
      localStorage.setItem(`activeOutlet_${organization.id}`, o.id);
    }
    setOutletState(o);
  };

  return (
    <OutletContext.Provider value={{ outlet, outlets, setOutlet, refresh: load }}>
      {children}
    </OutletContext.Provider>
  );
}

export function useOutlet() {
  return useContext(OutletContext);
}

export type { Outlet };
