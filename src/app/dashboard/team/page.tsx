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
import { toastApiError } from "@/lib/toast-errors";
import { useOutlet } from "@/hooks/use-outlet";

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
  token: string;
  expiresAt: string;
  outletIds: string[];
}

function inviteLink(token: string) {
  if (typeof window === "undefined") return `/invite/${token}`;
  return `${window.location.origin}/invite/${token}`;
}

export default function TeamPage() {
  const { organization } = useOrganization();
  const { outlets } = useOutlet();
  const { can } = usePermissions();
  const canManage = can("manageTeam");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", role: "staff" });
  const [inviteUrl, setInviteUrl] = useState("");
  const [outletIds, setOutletIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    if (!organization) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/workspaces/${organization.id}/members`).then((r) => r.json()),
      fetch(`/api/workspaces/${organization.id}/invites`).then((r) => r.json()),
    ])
      .then(([m, i]) => {
        if (Array.isArray(m)) setMembers(m);
        else setMembers([]);
        if (Array.isArray(i)) setInvites(i);
        else setInvites([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  async function sendInvite() {
    if (!organization || !form.email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/workspaces/${organization.id}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim().toLowerCase(),
        role: form.role,
        outletIds: form.role === "admin" ? [] : outletIds,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toastApiError(data.error);
      return;
    }
    const url = data.token ? inviteLink(data.token) : data.inviteUrl;
    setInviteUrl(url);
    setForm({ email: "", role: "staff" });
    setOutletIds([]);
    load();
    toast.success("Invite link ready — copy and share it (not emailed automatically)");
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy — select the link manually");
    }
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
        description="Create a restaurant group to invite your team."
        actionHref="/dashboard/setup"
        actionLabel="Start setup"
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

  const showOutletPicker = form.role === "staff" || form.role === "manager";

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
            <CardHeader>
              <CardTitle className="resto-heading text-base">Invite a teammate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground rounded-lg bg-secondary/20 border border-secondary/40 px-3 py-2">
                We create a shareable link — email is not sent automatically. The person must sign up or
                log in with the <strong>exact invited email</strong>.
              </p>
              <Input
                placeholder="Email address"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <div>
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 capitalize"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Owner is not listed — it belongs to whoever created this organization.
                </p>
              </div>

              {showOutletPicker && outlets.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Outlet access</p>
                  <div className="flex flex-wrap gap-2">
                    {outlets.map((o) => {
                      const checked = outletIds.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() =>
                            setOutletIds((prev) =>
                              checked ? prev.filter((id) => id !== o.id) : [...prev, o.id]
                            )
                          }
                          className={`text-xs rounded-full px-3 py-1 border ${
                            checked
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border"
                          }`}
                        >
                          {o.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Leave none selected for access to <strong>all outlets</strong>. Selecting outlets
                    restricts them to those locations only.
                  </p>
                </div>
              )}

              <Button className="rounded-full" onClick={sendInvite} disabled={submitting}>
                {submitting ? "Creating..." : "Create invite link"}
              </Button>

              {inviteUrl && (
                <div className="p-3 bg-secondary/20 rounded-xl text-xs border border-secondary/40 space-y-2">
                  <p className="font-semibold text-[var(--restaurant-brown)]">Share this link:</p>
                  <p className="font-mono break-all select-all">{inviteUrl}</p>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyLink(inviteUrl)}>
                    Copy link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {invites.length > 0 && (
            <Card className="resto-card border-0">
              <CardHeader>
                <CardTitle className="resto-heading text-base">Pending invites ({invites.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invites.map((inv) => {
                  const url = inviteLink(inv.token);
                  return (
                    <div key={inv.id} className="rounded-xl border border-border/60 p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-medium">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {inv.role}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyLink(url)}>
                          Copy link
                        </Button>
                        <DeleteButton
                          label="Revoke"
                          confirmMessage={`Revoke invite for ${inv.email}?`}
                          onDelete={() => revokeInvite(inv.id, inv.email)}
                        />
                      </div>
                    </div>
                  );
                })}
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
            <CardHeader>
              <CardTitle className="resto-heading text-base">Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 ring-2 ring-[var(--restaurant-mustard)] shrink-0">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                        {(m.user.name || m.user.email)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.user.name || m.user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                      {m.role !== "owner" && m.role !== "admin" && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {m.outletIds.length === 0
                            ? "All outlets"
                            : `${m.outletIds.length} outlet${m.outletIds.length === 1 ? "" : "s"}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="capitalize">{m.role}</Badge>
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
