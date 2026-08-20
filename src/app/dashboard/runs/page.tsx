"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@/hooks/use-organization";
import { useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { toast } from "sonner";

interface Run {
  id: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  sop: { id: string; title: string; steps: { title: string; description?: string }[] };
  items: { id: string; stepIndex: number; checked: boolean }[];
  assignedTo: { name: string | null; email: string };
}

interface SOP {
  id: string;
  title: string;
}

interface Member {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
}

export default function RunsPage() {
  const { organization } = useOrganization();
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canDeleteRuns = can("deleteChecklistRuns");
  const [runs, setRuns] = useState<Run[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedSop, setSelectedSop] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    setLoading(true);
    fetch(`/api/workspaces/${organization.id}/sops`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setSops(d);
          d.forEach((sop: SOP) => {
            fetch(`/api/workspaces/${organization.id}/sops/${sop.id}/runs`)
              .then((r) => r.json())
              .then((runs: Run[]) => {
                if (Array.isArray(runs)) {
                  setRuns((prev) => {
                    const ids = new Set(prev.map((r) => r.id));
                    return [...prev, ...runs.filter((r) => !ids.has(r.id))];
                  });
                }
              });
          });
        }
      });
    fetch(`/api/workspaces/${organization.id}/members`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setMembers(d))
      .finally(() => setLoading(false));
  }, [organization]);

  async function createRun() {
    if (!organization || !selectedSop) return;
    const res = await fetch(
      `/api/workspaces/${organization.id}/sops/${selectedSop}/runs`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToId: selectedMember || undefined,
          dueDate: dueDate || undefined,
        }),
      }
    );
    if (!res.ok) {
      toast.error("Failed to create run");
      return;
    }
    toast.success("Checklist run created");
    setDialogOpen(false);
    // reload
    const sop = sops.find((s) => s.id === selectedSop);
    const run = await res.json();
    run.sop = sop;
    setRuns((prev) => [run, ...prev]);
  }

  async function toggleItem(runId: string, itemId: string, checked: boolean) {
    const res = await fetch(`/api/runs/${runId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, checked }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRuns((prev) => prev.map((r) => (r.id === runId ? updated : r)));
    }
  }

  async function deleteRun(runId: string) {
    const ok = await apiDelete(`/api/runs/${runId}`);
    if (ok) {
      setRuns((prev) => prev.filter((r) => r.id !== runId));
      toast.success("Run deleted");
    }
    return ok;
  }

  if (!organization) {
    return (
      <RestoEmptyState
        icon="runs"
        title="Set up your organization first"
        description="Create checklists, then assign runs to your team."
        actionHref="/dashboard/setup"
        actionLabel="Start setup"
      />
    );
  }

  if (loading) return <RestoLoader message="Loading checklist runs..." />;

  const statusColor: Record<string, string> = {
    completed: "default",
    in_progress: "secondary",
    pending: "outline",
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="relative">
        <RestoPageHeader
          title="Checklist Runs"
          subtitle="Track prep and maintenance in progress"
          icon="runs"
          image="/images/resto-kitchen.png"
        />
        <div className="absolute top-4 right-4 z-10">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center rounded-full bg-[var(--restaurant-yellow)] px-5 py-2 text-sm font-semibold text-[var(--restaurant-brown)] hover:scale-105 transition-transform shadow-md">
              New Run
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Checklist Run</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>SOP</Label>
                <Select value={selectedSop} onValueChange={(val) => val && setSelectedSop(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SOP" />
                  </SelectTrigger>
                  <SelectContent>
                    {sops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign to</Label>
                <Select value={selectedMember} onValueChange={(val) => val && setSelectedMember(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.name || m.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due date (optional)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={createRun}>
                Create Run
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {runs.length === 0 ? (
        <RestoEmptyState icon="document" title="No runs yet" description="Create checklists first, then assign runs to your team." />
      ) : (
        <div className="space-y-4">
          {runs.map((run, i) => (
            <Card
              key={run.id}
              className="resto-card border-0 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setExpandedRun(expandedRun === run.id ? null : run.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="resto-heading text-base">
                      {run.sop?.title || "SOP"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned to {run.assignedTo?.name || run.assignedTo?.email}
                      {run.dueDate &&
                        ` · Due ${new Date(run.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-muted-foreground">
                      {run.items?.filter((i) => i.checked).length}/
                      {run.items?.length}
                    </span>
                    <Badge variant={statusColor[run.status] as "default" | "secondary" | "outline"}>
                      {run.status.replace("_", " ")}
                    </Badge>
                    {canDeleteRuns && (
                    <DeleteButton
                      label="Delete"
                      confirmMessage="Delete this checklist run?"
                      onDelete={() => deleteRun(run.id)}
                    />
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedRun === run.id && (
                <CardContent>
                  <div className="space-y-2">
                    {run.items?.map((item) => {
                      const step = (run.sop?.steps as any[])?.[item.stepIndex];
                      return (
                        <div key={item.id} className="flex items-start gap-3 py-1">
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={(checked) =>
                              toggleItem(run.id, item.id, checked === true)
                            }
                          />
                          <div>
                            <p className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                              {step?.title || `Step ${item.stepIndex + 1}`}
                            </p>
                            {step?.description && (
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
