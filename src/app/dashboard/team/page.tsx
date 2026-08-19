"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOrganization } from "@/hooks/use-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDenied } from "@/components/brand/role-badge";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { RoleGuide } from "@/components/brand/role-guide";
import { INVITABLE_ROLES, ROLE_LABELS } from "@/lib/roles";
import { toast } from "sonner";

interface Member {
  id: string;
  role: string;
  outletIds: string[];
  user: { id: string; name: string | null; email: string };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export default function TeamPage() {
  const { organization } = useOrganization();
  const { can } = usePermissions();
  const canManage = can("manageTeam");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", role: "staff" });
  const [inviteUrl, setInviteUrl] = useState("");

  function load() {
    if (!organization) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/workspaces/${organization.id}/members`).then((r) => r.json()),
      fetch(`/api/workspaces/${organization.id}/invites`).then((r) => r.json()),
    ]).then(([m, i]) => {
      if (Array.isArray(m)) setMembers(m);
      if (Array.isArray(i)) setInvites(i);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [organization]);

  async function sendInvite() {
    if (!organization || !form.email) return;
    const res = await fetch(`/api/workspaces/${organization.id}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error);
      return;
    }
    setInviteUrl(data.inviteUrl);
    setForm({ email: "", role: "staff" });
    load();
    toast.success("Invite sent");
  }

  async function revokeInvite(inviteId: string, email: string) {
    if (!organization) return false;
    const ok = await apiDelete(`/api/workspaces/${organization.id}/invites/${inviteId}`);
    if (ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success(`Revoked invite for ${email}`);
    }
    return ok;
  }

  async function removeMember(memberId: string, name: string) {
    if (!organization) return false;
    const ok = await apiDelete(`/api/workspaces/${organization.id}/members/${memberId}`);
    if (ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(`Removed ${name}`);
    }
    return ok;
  }

  if (!organization) {
    return (
      <RestoEmptyState
        icon="team"
        title="Set up your organization first"
        description="Create a restaurant group in Settings to invite your team."
      />
    );
  }

  if (!canManage) {
    return (
      <AccessDenied
        title="Team management restricted"
        description="Only admins and owners can invite staff and manage team members."
      />
    );
  }

  if (loading) return <RestoLoader message="Gathering the crew..." />;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="Team & Invites"
        subtitle="Invite-only access for your restaurant staff"
        icon="team"
        image="/images/resto-kitchen.png"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
      <Card className="resto-card border-0">
        <CardHeader><CardTitle className="resto-heading text-base">Send Invite</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm mt-1 capitalize"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1.5">
              Owner is not listed — it belongs to whoever created this organization.
            </p>
          </div>
          <Button className="rounded-full" onClick={sendInvite}>Send Invite</Button>
          {inviteUrl && (
            <div className="p-3 bg-secondary/20 rounded-xl text-xs break-all border border-secondary/40">
              Share this link: <span className="font-mono">{inviteUrl}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card className="resto-card border-0">
          <CardHeader><CardTitle className="resto-heading text-base">Pending Invites</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                <span>{inv.email}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{inv.role}</Badge>
                  <DeleteButton
                    label="Revoke"
                    confirmMessage={`Revoke invite for ${inv.email}?`}
                    onDelete={() => revokeInvite(inv.id, inv.email)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
        </div>

      <div className="space-y-6">
      <Card className="resto-card border-0">
        <CardHeader>
          <CardTitle className="resto-heading text-base">Role guide</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleGuide compact />
        </CardContent>
      </Card>

      <Card className="resto-card border-0">
        <CardHeader><CardTitle className="resto-heading text-base">Members ({members.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-[var(--restaurant-mustard)]">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                    {(m.user.name || m.user.email)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.user.name || m.user.email}</p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{m.role}</Badge>
                {m.role !== "owner" && (
                  <DeleteButton
                    label="Remove"
                    confirmMessage={`Remove ${m.user.name || m.user.email} from the team?`}
                    onDelete={() => removeMember(m.id, m.user.name || m.user.email)}
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </div>
      </div>
    </div>
  );
}
