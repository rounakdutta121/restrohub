"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrganization, type Organization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { RestoPageHeader } from "@/components/brand/page-header";
import { RoleGuide } from "@/components/brand/role-guide";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { toast } from "sonner";

const plans = [
  { key: "free", name: "Free", price: "$0/mo", features: ["1 outlet", "3 staff", "20 menu items"] },
  { key: "pro", name: "Pro", price: "$9/mo", features: ["5 outlets", "25 staff", "Unlimited menus"] },
  { key: "business", name: "Business", price: "$29/mo", features: ["Unlimited outlets", "Full platform"] },
];

export default function SettingsPage() {
  const { organization, organizations, setOrganization, refresh } = useOrganization();
  const { can, roleLabel, roleDescription } = usePermissions();
  const canDeleteOrg = can("deleteOrg");
  const canManageBilling = can("manageBilling");
  const [newName, setNewName] = useState("");
  const [upgradeOrg, setUpgradeOrg] = useState<Organization | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  async function createOrg() {
    if (!newName.trim()) return;
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setNewName("");
      refresh();
      toast.success("Organization created");
    }
  }

  async function changePlan(orgId: string, plan: string) {
    setUpgrading(true);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: orgId, plan }),
    });
    setUpgrading(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not change plan");
      return;
    }
    refresh();
    setUpgradeOrg(null);
    toast.success(`Plan updated to ${plan} (demo mode)`);
  }

  async function deleteOrg(orgId: string, name: string) {
    const ok = await apiDelete(`/api/workspaces/${orgId}`);
    if (ok) {
      if (organization?.id === orgId) localStorage.removeItem("activeOrgId");
      refresh();
      toast.success(`Deleted organization "${name}"`);
    }
    return ok;
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="Settings"
        subtitle="Organizations, plans & preferences"
        icon="settings"
        image="/images/resto-kitchen.png"
      />

      {organization && (
        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Your role — {roleLabel}</CardTitle>
            <CardDescription>{roleDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <RoleGuide compact />
          </CardContent>
        </Card>
      )}

      <Card className="resto-card border-0">
        <CardHeader>
          <CardTitle className="resto-heading text-base">Organizations</CardTitle>
          <CardDescription>Your restaurant groups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${
                organization?.id === org.id ? "border-primary bg-secondary/20 ring-2 ring-primary/20" : "border-border/60"
              }`}
            >
              <div className="flex-1 cursor-pointer min-w-0" onClick={() => setOrganization(org)}>
                <p className="text-sm font-semibold">{org.name}</p>
                <p className="text-xs text-muted-foreground">
                  {org._count?.outlets ?? 0} outlets · {org._count?.members ?? 0} staff
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className="rounded-full capitalize">{org.plan}</Badge>
                {canManageBilling && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setUpgradeOrg(org)}
                  >
                    Upgrade plan
                  </Button>
                )}
                {canDeleteOrg && (
                  <DeleteButton
                    label="Delete"
                    confirmMessage={`Delete "${org.name}" and ALL its outlets, menus, staff data? This cannot be undone.`}
                    onDelete={() => deleteOrg(org.id, org.name)}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Input placeholder="New organization name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button className="rounded-full shrink-0" onClick={createOrg}>Create</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!upgradeOrg} onOpenChange={(open) => !open && setUpgradeOrg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="resto-heading">
              Upgrade {upgradeOrg?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            Demo billing — no real charges. Only admins can change plans.
          </p>
          <div className="grid gap-3 pt-2">
            {plans.map((p) => (
              <div
                key={p.key}
                className={`resto-card p-4 transition-all ${
                  upgradeOrg?.plan === p.key ? "ring-2 ring-primary bg-secondary/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="resto-heading font-bold">{p.name}</h4>
                    <p className="text-lg font-bold text-primary">{p.price}</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
                      {p.features.map((f) => (
                        <li key={f}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                  {upgradeOrg?.plan === p.key ? (
                    <Badge className="rounded-full shrink-0">Current</Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full shrink-0"
                      disabled={upgrading}
                      onClick={() => upgradeOrg && changePlan(upgradeOrg.id, p.key)}
                    >
                      {p.key === "free" ? "Downgrade" : "Select"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
