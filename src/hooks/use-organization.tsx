"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchJson } from "@/lib/fetch-json";

export interface Organization {
  id: string;
  name: string;
  plan: string;
  ownerId: string;
  role?: string;
  outletIds?: string[];
  _count?: { members: number; outlets: number; sops: number };
}

export interface Outlet {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone: string;
  currency: string;
  isActive: boolean;
  workspaceId: string;
}

interface OrgContextType {
  organization: Organization | null;
  organizations: Organization[];
  setOrganization: (org: Organization) => void;
  refresh: () => void;
}

const OrgContext = createContext<OrgContextType>({
  organization: null,
  organizations: [],
  setOrganization: () => {},
  refresh: () => {},
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganizationState] = useState<Organization | null>(null);

  const load = useCallback(async () => {
    const data = await fetchJson<Organization[]>("/api/workspaces");
    if (Array.isArray(data)) {
      setOrganizations(data);
      const saved = localStorage.getItem("activeOrgId");
      const found = saved ? data.find((o) => o.id === saved) : null;
      setOrganizationState(found || data[0] || null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setOrganization = (org: Organization) => {
    localStorage.setItem("activeOrgId", org.id);
    setOrganizationState(org);
  };

  return (
    <OrgContext.Provider value={{ organization, organizations, setOrganization, refresh: load }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrgContext);
}

// Backward compat alias
export const WorkspaceProvider = OrganizationProvider;
export const useWorkspace = useOrganization;
