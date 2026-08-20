"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { useOutlet } from "@/hooks/use-outlet";
import { toast } from "sonner";

interface Outlet {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone: string;
  currency: string;
  isActive: boolean;
}

export default function OutletsPage() {
  const { organization, refresh: refreshOrg } = useOrganization();
  const { setOutlet, refresh: refreshOutlets } = useOutlet();
  const { can } = usePermissions();
  const canManage = can("manageOutlets");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", address: "", city: "", country: "", currency: "INR" });

  useEffect(() => {
    if (!organization) return;
    setLoading(true);
    fetch(`/api/workspaces/${organization.id}/outlets`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setOutlets(d))
      .finally(() => setLoading(false));
  }, [organization]);

  async function createOutlet() {
    if (!organization) return;
    const res = await fetch(`/api/workspaces/${organization.id}/outlets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      const { toastApiError } = await import("@/lib/toast-errors");
      toastApiError(data.error);
      return;
    }
    setOutlets((prev) => [...prev, data]);
    setOpen(false);
    setForm({ name: "", address: "", city: "", country: "", currency: "INR" });
    refreshOrg();
    await refreshOutlets();
    setOutlet(data);
    toast.success("Outlet created — selected in the header");
  }

  async function deleteOutlet(id: string, name: string) {
    const ok = await apiDelete(`/api/outlets/${id}`);
    if (ok) {
      setOutlets((prev) => prev.filter((o) => o.id !== id));
      refreshOrg();
      refreshOutlets();
      toast.success(`Deleted "${name}"`);
    }
  }

  if (!organization) {
    return (
      <RestoEmptyState
        icon="outlets"
        title="Set up your organization first"
        description="Create a restaurant group, then add your outlets here."
        actionHref="/dashboard/setup"
        actionLabel="Start setup"
      />
    );
  }

  if (loading) return <RestoLoader message="Finding your locations..." />;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="Outlets"
        subtitle="Every location in your restaurant family"
        icon="outlets"
        image="/images/resto-hero.png"
        action={
          canManage ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger className="inline-flex items-center justify-center rounded-full bg-[var(--restaurant-yellow)] px-5 py-2 text-sm font-semibold text-[var(--restaurant-brown)] hover:scale-105 transition-transform shadow-md">
                + Add Outlet
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Outlet</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                    <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
                  </div>
                  <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
                  <Button className="w-full" onClick={createOutlet}>Create Outlet</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {outlets.length === 0 ? (
        <RestoEmptyState
          icon="location"
          title="No outlets yet"
          description="Add your first restaurant location — Mumbai, Dubai, or right around the corner."
          action={
            canManage ? (
              <Button className="rounded-full px-6" onClick={() => setOpen(true)}>
                + Add Outlet
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((o, i) => (
            <Card
              key={o.id}
              className="resto-card border-0 opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform"
              style={{ animationDelay: `${i * 0.06}s`, animationFillMode: "forwards" }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="resto-heading text-base">{o.name}</CardTitle>
                  <Badge variant={o.isActive ? "default" : "secondary"}>{o.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{o.city}, {o.country}</p>
                <p className="text-xs text-muted-foreground mt-1">{o.address}</p>
                <p className="text-xs mt-2 font-medium text-[var(--restaurant-brown)]">Currency: {o.currency}</p>
                {canManage && (
                <DeleteButton
                  label="Delete outlet"
                  confirmMessage={`Delete "${o.name}"? This removes all menus, stock, tables and finance data for this location.`}
                  onDelete={() => deleteOutlet(o.id, o.name)}
                  className="mt-3 px-0"
                />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
