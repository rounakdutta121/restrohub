"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOutlet } from "@/hooks/use-outlet";
import { useOutletLive } from "@/hooks/use-outlet-live";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { toast } from "sonner";

type KitchenItem = {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  kitchenStatus: string;
  sentToKitchenAt: string | null;
};

type Ticket = {
  allocationId: string;
  orderId: string;
  tableId: string;
  tableLabel: string;
  guestName: string;
  guestCount: number;
  oldestSentAt: string;
  items: KitchenItem[];
};

type Filter = "all" | "pending" | "preparing" | "ready";

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

function statusBadge(status: string) {
  if (status === "ready") return "default" as const;
  if (status === "preparing") return "secondary" as const;
  return "outline" as const;
}

export default function KitchenPage() {
  const { outlet } = useOutlet();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const knownPending = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const load = useCallback(() => {
    if (!outlet) return;
    fetch(`/api/outlets/${outlet.id}/kitchen`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const next: Ticket[] = d.tickets || [];
        const pendingIds = new Set(
          next.flatMap((t) =>
            t.items.filter((i) => i.kitchenStatus === "pending").map((i) => i.id)
          )
        );
        if (primed.current) {
          for (const id of pendingIds) {
            if (!knownPending.current.has(id)) {
              toast.message("New kitchen order", {
                description: "A new item just landed on the board",
              });
              break;
            }
          }
        }
        knownPending.current = pendingIds;
        primed.current = true;
        setTickets(next);
      })
      .finally(() => setLoading(false));
  }, [outlet]);

  useEffect(() => {
    primed.current = false;
    knownPending.current = new Set();
    setLoading(true);
    load();
  }, [load]);

  useOutletLive(outlet?.id, () => load());

  async function setStatus(itemId: string, status: string) {
    if (!outlet) return;
    setBusyId(itemId);
    const res = await fetch(`/api/outlets/${outlet.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kitchen_set_status", itemId, status }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Could not update status");
      return;
    }
    load();
  }

  const visible = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets
      .map((t) => ({
        ...t,
        items: t.items.filter((i) => i.kitchenStatus === filter),
      }))
      .filter((t) => t.items.length > 0);
  }, [tickets, filter]);

  if (!outlet) {
    return (
      <RestoEmptyState
        icon="chef"
        title="Select an outlet"
        description="Kitchen tickets are per location. Choose an outlet to see live orders."
        actionHref="/dashboard/outlets"
        actionLabel="Go to Outlets"
      />
    );
  }

  if (loading) return <RestoLoader message="Loading kitchen board..." />;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="Kitchen"
        subtitle={`${outlet.name} — live tickets update automatically (no reload)`}
        icon="chef"
        image="/images/resto-kitchen.png"
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "preparing", "ready"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            className="rounded-full capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <RestoEmptyState
          icon="chef"
          title="No tickets right now"
          description="When waiters seat a table with items or add dishes, they appear here instantly."
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((t) => (
            <Card key={t.orderId} className="resto-card border-0 ring-1 ring-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="resto-heading text-lg">{t.tableLabel}</CardTitle>
                  <Badge variant="outline">{timeAgo(t.oldestSentAt)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.guestName} · {t.guestCount} guests
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {t.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-secondary/15 p-3 space-y-2"
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <div>
                        <p className="font-semibold">
                          {item.quantity}× {item.name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                        )}
                      </div>
                      <Badge variant={statusBadge(item.kitchenStatus)} className="capitalize shrink-0">
                        {item.kitchenStatus}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.kitchenStatus === "pending" && (
                        <Button
                          size="sm"
                          className="rounded-full"
                          disabled={busyId === item.id}
                          onClick={() => setStatus(item.id, "preparing")}
                        >
                          Start
                        </Button>
                      )}
                      {(item.kitchenStatus === "pending" ||
                        item.kitchenStatus === "preparing") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                          disabled={busyId === item.id}
                          onClick={() => setStatus(item.id, "ready")}
                        >
                          Ready
                        </Button>
                      )}
                      {item.kitchenStatus !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full text-xs"
                          disabled={busyId === item.id}
                          onClick={() => setStatus(item.id, "cancelled")}
                        >
                          Cancel line
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
