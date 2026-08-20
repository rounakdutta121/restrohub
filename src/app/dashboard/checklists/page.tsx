"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/use-organization";
import { useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { ReadOnlyNotice } from "@/components/brand/role-badge";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { toast } from "sonner";

interface Checklist {
  id: string;
  title: string;
  description: string | null;
  type: string;
  steps: { title: string }[];
  outlet?: { name: string } | null;
  _count: { runs: number };
}

const typeColors: Record<string, string> = {
  prep: "default",
  maintenance: "secondary",
  opening: "outline",
  closing: "outline",
};

export default function ChecklistsPage() {
  const { organization } = useOrganization();
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canEdit = can("manageChecklists");
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    setLoading(true);
    const params = outlet ? `?outletId=${outlet.id}` : "";
    fetch(`/api/workspaces/${organization.id}/sops${params}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setChecklists(d))
      .finally(() => setLoading(false));
  }, [organization, outlet]);

  async function createChecklist(type: string) {
    if (!organization) return;
    const res = await fetch(`/api/workspaces/${organization.id}/sops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `New ${type} checklist`,
        type,
        outletId: outlet?.id,
        steps: [{ title: "Step 1", description: "" }],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const { toastApiError } = await import("@/lib/toast-errors");
      toastApiError(data.error);
      return;
    }
    setChecklists((prev) => [data, ...prev]);
    toast.success("Checklist created");
  }

  async function deleteChecklist(id: string, title: string) {
    if (!organization) return false;
    const ok = await apiDelete(`/api/workspaces/${organization.id}/sops/${id}`);
    if (ok) {
      setChecklists((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Deleted "${title}"`);
    }
    return ok;
  }

  if (!organization) {
    return (
      <RestoEmptyState
        icon="prep"
        title="Set up your organization first"
        description="Create a restaurant group to build prep and maintenance checklists."
        actionHref="/dashboard/setup"
        actionLabel="Start setup"
      />
    );
  }

  if (loading) return <RestoLoader message="Loading checklists..." />;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="relative">
        <RestoPageHeader
          title="Checklists"
          subtitle="Prep, opening, closing & maintenance"
          icon="prep"
          image="/images/resto-kitchen.png"
        />
        {canEdit && (
        <div className="absolute top-4 right-4 z-10 hidden sm:flex gap-2">
          {["prep", "maintenance", "opening", "closing"].map((t) => (
            <Button key={t} size="sm" variant="secondary" className="rounded-full capitalize text-xs" onClick={() => createChecklist(t)}>
              + {t}
            </Button>
          ))}
        </div>
        )}
      </div>

      {!canEdit && (
        <ReadOnlyNotice message="You can view checklists and start runs, but only managers can create or edit them." />
      )}

      {canEdit && (
      <div className="flex gap-2 flex-wrap sm:hidden">
        {["prep", "maintenance", "opening", "closing"].map((t) => (
          <Button key={t} size="sm" variant="outline" className="rounded-full capitalize" onClick={() => createChecklist(t)}>
            + {t}
          </Button>
        ))}
      </div>
      )}

      {checklists.length === 0 ? (
        <RestoEmptyState icon="document" title="No checklists yet" description="Create a prep, opening, or closing checklist to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {checklists.map((c, i) => (
            <Card
              key={c.id}
              className="resto-card border-0 opacity-0 animate-fade-in-up hover:scale-[1.02] transition-transform"
              style={{ animationDelay: `${i * 0.06}s`, animationFillMode: "forwards" }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="resto-heading text-base">{c.title}</CardTitle>
                  <Badge variant={typeColors[c.type] as "default" | "secondary" | "outline"}>{c.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  {c.outlet?.name || "All outlets"} · {c._count?.runs || 0} runs
                </p>
                <div className="flex gap-2">
                  <Link href={`/dashboard/checklists/${c.id}`}>
                    <Button size="sm" variant="outline" className="rounded-full">{canEdit ? "Edit" : "View"}</Button>
                  </Link>
                  {canEdit && (
                  <DeleteButton
                    label="Delete"
                    confirmMessage={`Delete checklist "${c.title}"?`}
                    onDelete={() => deleteChecklist(c.id, c.title)}
                  />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
