"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MenuOrderPicker,
  GuestFields,
  type MenuCategory,
  type CartLine,
} from "@/components/tables/menu-order-picker";
import { formatCurrency } from "@/lib/currency";
import { orderSubtotal } from "@/lib/order-math";
import { toast } from "sonner";
import { Search } from "lucide-react";

export type ServiceOrder = {
  id: string;
  mode: string;
  status: string;
  guestName: string;
  guestCount: number;
  guestPhone?: string | null;
  reservedFor?: string | null;
  tableId?: string | null;
  table?: { id: string; label: string; status: string } | null;
  order?: {
    id: string;
    items: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      voided?: boolean;
      kitchenStatus?: string;
    }[];
  } | null;
};

type TableOption = { id: string; label: string; status: string; capacity: number };

export function ServiceQueues({
  outletId,
  currency,
  menu,
  tables,
  serviceOrders,
  onChanged,
}: {
  outletId: string;
  currency: string;
  menu: MenuCategory[];
  tables: TableOption[];
  serviceOrders: ServiceOrder[];
  onChanged: () => void;
}) {
  const fmt = (n: number) => formatCurrency(n, currency);
  const [open, setOpen] = useState<"takeaway" | "waitlist" | "reservation" | null>(
    null
  );
  const [seatId, setSeatId] = useState<string | null>(null);
  const [seatTableId, setSeatTableId] = useState("");
  const [busy, setBusy] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [guestPhone, setGuestPhone] = useState("");
  const [tableId, setTableId] = useState("");
  const [reservedFor, setReservedFor] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [queueSearch, setQueueSearch] = useState("");

  function matchesSearch(o: ServiceOrder, q: string) {
    if (!q) return true;
    const hay = [
      o.guestName,
      o.guestPhone ?? "",
      o.table?.label ?? "",
      o.mode,
      o.status,
      o.reservedFor ? new Date(o.reservedFor).toLocaleString() : "",
      ...(o.order?.items ?? [])
        .filter((i) => !i.voided)
        .map((i) => `${i.name} ${i.quantity}`),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  const q = queueSearch.trim().toLowerCase();

  const takeaways = useMemo(
    () =>
      serviceOrders.filter(
        (o) =>
          o.mode === "takeaway" && o.status === "active" && matchesSearch(o, q)
      ),
    [serviceOrders, q]
  );
  const waitlist = useMemo(
    () =>
      serviceOrders.filter(
        (o) =>
          o.mode === "waitlist" && o.status === "waiting" && matchesSearch(o, q)
      ),
    [serviceOrders, q]
  );
  const reservations = useMemo(
    () =>
      serviceOrders.filter(
        (o) =>
          o.mode === "reservation" &&
          o.status === "reserved" &&
          matchesSearch(o, q)
      ),
    [serviceOrders, q]
  );

  function resetForm() {
    setGuestName("");
    setGuestCount("2");
    setGuestPhone("");
    setTableId("");
    setReservedFor("");
    setCart([]);
  }

  async function post(action: string, body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/outlets/${outletId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Request failed");
      return false;
    }
    return true;
  }

  async function createOrder() {
    if (!guestName.trim()) {
      toast.error("Enter guest name");
      return;
    }
    const items = cart.map((c) => ({
      menuItemId: c.menuItemId,
      quantity: c.quantity,
    }));

    if (open === "takeaway") {
      if (!items.length) {
        toast.error("Add at least one menu item");
        return;
      }
      const ok = await post("create_takeaway", {
        guestName,
        guestCount: parseInt(guestCount) || 1,
        guestPhone,
        items,
      });
      if (ok) {
        toast.success("Takeaway sent to kitchen");
        setOpen(null);
        resetForm();
        onChanged();
      }
      return;
    }

    if (open === "waitlist") {
      const ok = await post("create_waitlist", {
        guestName,
        guestCount: parseInt(guestCount) || 2,
        guestPhone,
        items,
      });
      if (ok) {
        toast.success("Added to waitlist");
        setOpen(null);
        resetForm();
        onChanged();
      }
      return;
    }

    if (open === "reservation") {
      if (!tableId || !reservedFor) {
        toast.error("Pick a table and time");
        return;
      }
      const ok = await post("create_reservation", {
        guestName,
        guestCount: parseInt(guestCount) || 2,
        guestPhone,
        tableId,
        reservedFor: new Date(reservedFor).toISOString(),
        items,
      });
      if (ok) {
        toast.success("Reservation booked — table held 15 min before arrival");
        setOpen(null);
        resetForm();
        onChanged();
      }
    }
  }

  async function seatWaitlist() {
    if (!seatId || !seatTableId) {
      toast.error("Select a free table");
      return;
    }
    const ok = await post("seat_waitlist", {
      allocationId: seatId,
      tableId: seatTableId,
    });
    if (ok) {
      toast.success("Guest seated — kitchen updated");
      setSeatId(null);
      setSeatTableId("");
      onChanged();
    }
  }

  async function arriveReservation(id: string) {
    const ok = await post("arrive_reservation", { allocationId: id });
    if (ok) {
      toast.success("Reservation arrived — kitchen notified");
      onChanged();
    }
  }

  async function cancelOrder(id: string) {
    const ok = await post("cancel_service_order", { allocationId: id });
    if (ok) {
      toast.success("Cancelled");
      onChanged();
    }
  }

  async function settleTakeaway(id: string) {
    const ok = await post("settle_service_order", {
      allocationId: id,
      paymentMethod: "cash",
    });
    if (ok) {
      toast.success("Takeaway paid");
      onChanged();
    }
  }

  const availableTables = tables.filter((t) => t.status === "available");

  function OrderCard({
    o,
    actions,
  }: {
    o: ServiceOrder;
    actions: React.ReactNode;
  }) {
    const items = (o.order?.items ?? []).filter((i) => !i.voided);
    return (
      <div className="rounded-xl border border-border/60 bg-secondary/10 p-3 space-y-2">
        <div className="flex justify-between gap-2 items-start">
          <div>
            <p className="font-medium text-sm">
              {o.guestName} · {o.guestCount}
            </p>
            {o.guestPhone && (
              <p className="text-xs text-muted-foreground">{o.guestPhone}</p>
            )}
            {o.table?.label && (
              <p className="text-xs text-muted-foreground">Table {o.table.label}</p>
            )}
            {o.reservedFor && (
              <p className="text-xs text-primary font-medium">
                {new Date(o.reservedFor).toLocaleString()}
              </p>
            )}
          </div>
          <Badge variant="outline" className="capitalize shrink-0">
            {o.mode}
          </Badge>
        </div>
        {items.length > 0 ? (
          <ul className="text-xs space-y-0.5 text-muted-foreground">
            {items.slice(0, 4).map((i) => (
              <li key={i.id}>
                {i.quantity}× {i.name}
                {i.kitchenStatus ? ` · ${i.kitchenStatus}` : ""}
              </li>
            ))}
            {items.length > 4 && <li>+{items.length - 4} more</li>}
            <li className="font-semibold text-foreground pt-1">
              {fmt(orderSubtotal(items))}
            </li>
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No items yet</p>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">{actions}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="resto-card border-0">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="resto-heading text-base">
              Takeaway · Waitlist · Reservations
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => {
                  resetForm();
                  setOpen("takeaway");
                }}
              >
                New takeaway
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  resetForm();
                  setOpen("waitlist");
                }}
              >
                Add waitlist
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  resetForm();
                  setOpen("reservation");
                }}
              >
                Prebook table
              </Button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              placeholder="Search takeaway, waitlist & prebook — name, phone, table, items…"
              className="pl-9 rounded-full"
              aria-label="Search service queues"
            />
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Takeaway ({takeaways.length}
              {q ? ` match` : ""})
            </p>
            {takeaways.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {q ? "No matches" : "None open"}
              </p>
            )}
            {takeaways.map((o) => (
              <OrderCard
                key={o.id}
                o={o}
                actions={
                  <>
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => settleTakeaway(o.id)}
                      disabled={busy}
                    >
                      Settle & pay
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => cancelOrder(o.id)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                  </>
                }
              />
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Waitlist ({waitlist.length})
            </p>
            {waitlist.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {q ? "No matches" : "Nobody waiting"}
              </p>
            )}
            {waitlist.map((o) => (
              <OrderCard
                key={o.id}
                o={o}
                actions={
                  <>
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setSeatId(o.id);
                        setSeatTableId("");
                      }}
                      disabled={busy || availableTables.length === 0}
                    >
                      Seat at table
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => cancelOrder(o.id)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                  </>
                }
              />
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reservations ({reservations.length})
            </p>
            {reservations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {q ? "No matches" : "No upcoming holds"}
              </p>
            )}
            {reservations.map((o) => (
              <OrderCard
                key={o.id}
                o={o}
                actions={
                  <>
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => arriveReservation(o.id)}
                      disabled={busy}
                    >
                      Guest arrived
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => cancelOrder(o.id)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!open}
        onOpenChange={(v) => {
          if (!v) setOpen(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="resto-heading capitalize">
              {open === "takeaway" && "New takeaway"}
              {open === "waitlist" && "Add to waitlist"}
              {open === "reservation" && "Prebook / reservation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <GuestFields
              guestName={guestName}
              guestCount={guestCount}
              onGuestNameChange={setGuestName}
              onGuestCountChange={setGuestCount}
            />
            <div>
              <label className="text-sm font-medium">Phone (optional)</label>
              <Input
                className="mt-1"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="For reminders / call-back"
              />
            </div>
            {open === "reservation" && (
              <>
                <div>
                  <label className="text-sm font-medium">Table</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                  >
                    <option value="">Select table</option>
                    {availableTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} (seats {t.capacity})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Table stays free for walk-ins until 15 minutes before this time.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Arrive at</label>
                  <Input
                    type="datetime-local"
                    className="mt-1"
                    value={reservedFor}
                    onChange={(e) => setReservedFor(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    At T−15 min the table is held if free; if busy, staff are notified to clear it.
                  </p>
                </div>
              </>
            )}
            <MenuOrderPicker
              categories={menu}
              cart={cart}
              onCartChange={setCart}
              currency={currency}
            />
            <Button
              className="w-full rounded-full"
              onClick={createOrder}
              disabled={busy}
            >
              {busy ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!seatId}
        onOpenChange={(v) => {
          if (!v) setSeatId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="resto-heading">Seat waitlist guest</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Pick a free table — their pre-ordered items move onto that table and
              the kitchen is notified live.
            </p>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={seatTableId}
              onChange={(e) => setSeatTableId(e.target.value)}
            >
              <option value="">Select table</option>
              {availableTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button
              className="w-full rounded-full"
              onClick={seatWaitlist}
              disabled={busy || !seatTableId}
            >
              Seat & send to kitchen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
