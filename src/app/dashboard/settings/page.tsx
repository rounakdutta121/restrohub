"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { RestoPageHeader } from "@/components/brand/page-header";
import { RoleGuide } from "@/components/brand/role-guide";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { toast } from "sonner";

export default function SettingsPage() {
  const { organization, organizations, setOrganization, refresh } = useOrganization();
  const { can, roleLabel, roleDescription } = usePermissions();
  const canDeleteOrg = can("deleteOrg");
  const [newName, setNewName] = useState("");

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
      toast.success("Organization created — add your first outlet next");
      window.location.href = "/dashboard/outlets";
    }
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
        subtitle="Organizations & preferences"
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
          <CardDescription>
            Your restaurant groups. Everything is free during this release — unlimited outlets, staff, and menus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${
                organization?.id === org.id
                  ? "border-primary bg-secondary/20 ring-2 ring-primary/20"
                  : "border-border/60"
              }`}
            >
              <div className="flex-1 cursor-pointer min-w-0" onClick={() => setOrganization(org)}>
                <p className="text-sm font-semibold">{org.name}</p>
                <p className="text-xs text-muted-foreground">
                  {org._count?.outlets ?? 0} outlets · {org._count?.members ?? 0} staff
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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
            <Input
              placeholder="New organization name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button className="rounded-full shrink-0" onClick={createOrg}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
