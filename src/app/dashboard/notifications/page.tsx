"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";
import { toast } from "sonner";
import { useOutlet } from "@/hooks/use-outlet";
import { useOutletLive } from "@/hooks/use-outlet-live";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  outlet?: { name: string } | null;
}

const typeIcons: Record<string, RestoIconName> = {
  low_stock: "stock",
  new_order: "chef",
  takeaway_order: "chef",
  waitlist_order: "tables",
  waitlist_seated: "tables",
  reservation_order: "tables",
  reservation_reminder: "bell",
  reservation_clear_table: "tables",
  order_settled: "finance",
  checklist_due: "clock",
  overdue_checklist: "clock",
  maintenance_due: "maintenance",
  maintenance: "maintenance",
};

export default function NotificationsPage() {
  const { outlet } = useOutlet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback((opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setNotifications(d))
      .finally(() => {
        if (!opts?.silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOutletLive(outlet?.id, () => load({ silent: true }));

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  }

  async function deleteNotification(id: string) {
    const ok = await apiDelete("/api/notifications", { id });
    if (ok) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    }
    return ok;
  }

  async function clearAll() {
    setClearing(true);
    const ok = await apiDelete("/api/notifications", { clearAll: true });
    setClearing(false);
    if (ok) {
      setNotifications([]);
      setClearOpen(false);
      toast.success("All notifications cleared");
    }
  }

  if (loading) return <RestoLoader message="Checking the kitchen alerts..." />;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="relative">
        <RestoPageHeader
          title="Notifications"
          subtitle="Live alerts by role — stock, kitchen, finance, and checklists"
          icon="bell"
          image="/images/resto-kitchen.png"
        />
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {notifications.some((n) => !n.read) && (
            <Button variant="secondary" size="sm" className="rounded-full" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-destructive"
              onClick={() => setClearOpen(true)}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear all notifications?"
        description="This removes every notification from your inbox. This cannot be undone."
        confirmLabel="Clear all"
        onConfirm={clearAll}
        loading={clearing}
      />

      <Card className="resto-card border-0">
        <CardHeader><CardTitle className="resto-heading">All Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <RestoEmptyState
              icon="sparkle"
              title="All clear!"
              description="No alerts right now. Your kitchen is running smoothly."
            />
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all opacity-0 animate-fade-in-up ${
                  !n.read ? "bg-secondary/20 border-secondary/40 shadow-sm" : "border-border/50"
                }`}
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <RestoIcon name={typeIcons[n.type] || "bell"} className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="text-xs capitalize">{n.type.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                    <DeleteButton
                      label="Delete"
                      confirmMessage="Delete this notification?"
                      onDelete={() => deleteNotification(n.id)}
                    />
                  </div>
                </div>
                <p className="text-sm mt-2">{n.message}</p>
                {n.outlet && (
                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <RestoIcon name="location" className="h-3 w-3" />
                    {n.outlet.name}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
