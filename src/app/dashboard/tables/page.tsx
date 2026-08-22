"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOutlet } from "@/hooks/use-outlet";
import { useOutletLive } from "@/hooks/use-outlet-live";
import { usePermissions } from "@/hooks/use-permissions";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import {
  MenuOrderPicker,
  GuestFields,
  type MenuCategory,
  type CartLine,
} from "@/components/tables/menu-order-picker";
import { ServiceQueues, type ServiceOrder } from "@/components/tables/service-queues";
import { orderSubtotal } from "@/lib/order-math";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  voided?: boolean;
  kitchenStatus?: string;
}

function kitchenBadgeVariant(status?: string) {
  if (status === "ready") return "default" as const;
  if (status === "preparing") return "secondary" as const;
  return "outline" as const;
}

interface Allocation {
  id: string;
  guestName: string;
  guestCount: number;
  order?: { id: string; items: OrderItem[]; status?: string } | null;
}

interface Table {
  id: string;
  label: string;
  capacity: number;
  status: string;
  allocations: Allocation[];
}

type CloseMode = "settle" | "cancel" | "walkout" | "comp" | null;

const emptyGuest = { tableId: "", guestName: "", guestCount: "2" };

export default function TablesPage() {
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canManageSetup = can("manageTableSetup");
  const canFinance = can("manageFinance");
  const [tables, setTables] = useState<Table[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTable, setNewTable] = useState({ label: "", capacity: "4" });
  const [seatOpen, setSeatOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [guest, setGuest] = useState(emptyGuest);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeAllocation, setActiveAllocation] = useState<Allocation | null>(null);
  const [addCart, setAddCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [closeMode, setCloseMode] = useState<CloseMode>(null);
  const [closeTable, setCloseTable] = useState<Table | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [closeReason, setCloseReason] = useState("");
  const [recordWaste, setRecordWaste] = useState(false);

  const load = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!outlet) return;
      if (!opts?.silent) setLoading(true);

      async function readJson(res: Response) {
        const text = await res.text();
        if (!res.ok || !text) return null;
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      }

      function applyTablesPayload(tablesData: unknown) {
        if (Array.isArray(tablesData)) {
          setTables(tablesData);
          return;
        }
        if (
          tablesData &&
          typeof tablesData === "object" &&
          Array.isArray((tablesData as { tables?: unknown }).tables)
        ) {
          const payload = tablesData as {
            tables: Table[];
            serviceOrders?: ServiceOrder[];
          };
          setTables(payload.tables);
          if (Array.isArray(payload.serviceOrders)) {
            setServiceOrders(payload.serviceOrders);
          }
        }
      }

      const tablesReq = fetch(`/api/outlets/${outlet.id}/tables`, {
        cache: "no-store",
      }).then(readJson);

      // Live polls only need tables; menus change rarely.
      if (opts?.silent) {
        tablesReq
          .then(applyTablesPayload)
          .catch(() => {})
          .finally(() => {});
        return;
      }

      Promise.all([
        tablesReq,
        fetch(`/api/outlets/${outlet.id}/menus`, { cache: "no-store" }).then(readJson),
      ])
        .then(([tablesData, menuData]) => {
          applyTablesPayload(tablesData);
          if (Array.isArray(menuData)) setMenu(menuData);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [outlet]
  );

  useEffect(() => {
    load();
  }, [load]);

  useOutletLive(outlet?.id, () => load({ silent: true }));

  // Keep open order dialog in sync with live table refreshes
  useEffect(() => {
    if (!activeAllocation) return;
    for (const t of tables) {
      const alloc = t.allocations[0];
      if (alloc?.id === activeAllocation.id) {
        setActiveAllocation(alloc);
        return;
      }
    }
  }, [tables, activeAllocation?.id]);

  function resetSeatForm() {
    setGuest(emptyGuest);
    setCart([]);
  }

  function openSeatDialog(tableId?: string) {
    resetSeatForm();
    if (tableId) setGuest((g) => ({ ...g, tableId }));
    setSeatOpen(true);
  }

  function openOrderDialog(allocation: Allocation) {
    setActiveAllocation(allocation);
    setAddCart([]);
    setOrderOpen(true);
  }

  function openClose(table: Table, mode: CloseMode) {
    setCloseTable(table);
    setCloseMode(mode);
    setPaymentMethod("cash");
    setCloseReason("");
    setRecordWaste(false);
  }

  async function createTable() {
    if (!outlet) return;
    const res = await fetch(`/api/outlets/${outlet.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_table",
        ...newTable,
        capacity: parseInt(newTable.capacity),
      }),
    });
    if (res.ok) {
      load();
      setNewTable({ label: "", capacity: "4" });
      toast.success("Table added");
    }
  }

  async function seatGuests() {
    if (!outlet || !guest.tableId || !guest.guestName.trim()) {
      toast.error("Pick a table and enter guest name");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/outlets/${outlet.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "allocate",
        tableId: guest.tableId,
        guestName: guest.guestName.trim(),
        guestCount: parseInt(guest.guestCount) || 2,
        items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not seat guests");
      return;
    }
    load();
    setSeatOpen(false);
    resetSeatForm();
    toast.success(cart.length ? "Guests seated with order" : "Guests seated");
  }

  async function addItemsToOrder() {
    if (!outlet || !activeAllocation || addCart.length === 0) {
      toast.error("Add at least one menu item");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/outlets/${outlet.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_order_items",
        allocationId: activeAllocation.id,
        items: addCart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Could not update order");
      return;
    }
    load();
    setOrderOpen(false);
    setAddCart([]);
    toast.success("Order updated");
  }

  async function removeOrderItem(itemId: string) {
    if (!outlet) return;
    const res = await fetch(`/api/outlets/${outlet.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_order_item", itemId }),
    });
    if (res.ok) {
      load();
      setActiveAllocation((prev) =>
        prev
          ? {
              ...prev,
              order: prev.order
                ? { ...prev.order, items: prev.order.items.filter((i) => i.id !== itemId) }
                : null,
            }
          : null
      );
      toast.success("Item removed");
    }
  }

  async function confirmClose() {
    if (!outlet || !closeTable || !closeMode) return;

    if (closeMode !== "settle" && !closeReason.trim()) {
      toast.error("Enter a reason");
      return;
    }

    setSubmitting(true);
    const action =
      closeMode === "settle"
        ? "settle_pay"
        : closeMode === "cancel"
          ? "cancel_seating"
          : closeMode === "comp"
            ? "comp_close"
            : "walkout_close";

    const res = await fetch(`/api/outlets/${outlet.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        tableId: closeTable.id,
        paymentMethod: closeMode === "settle" ? paymentMethod : undefined,
        reason: closeReason.trim() || undefined,
        recordWaste: closeMode === "walkout" || closeMode === "comp" ? recordWaste : undefined,
      }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Could not close table");
      return;
    }

    load();
    setCloseMode(null);
    setCloseTable(null);
    const messages: Record<string, string> = {
      settle: "Bill paid — counted as income",
      cancel: "Seating cancelled — not counted",
      walkout: "Walkout recorded — not counted as income",
      comp: "Comp recorded — not counted as income",
    };
    toast.success(messages[closeMode]);
  }

  async function deleteTable(tableId: string, label: string) {
    if (!outlet) return false;
    const ok = await apiDelete(`/api/outlets/${outlet.id}/tables`, { tableId });
    if (ok) {
      load();
      toast.success(`Deleted table ${label}`);
    }
    return ok;
  }

  const statusColor: Record<string, "default" | "secondary" | "outline"> = {
    available: "default",
    occupied: "secondary",
    reserved: "outline",
  };

  const currency = outlet?.currency ?? "USD";
  const fmt = (amount: number) => formatCurrency(amount, currency);

  if (!outlet) {
    return (
      <RestoEmptyState
        icon="tables"
        title="Add an outlet first"
        description="Tables and orders are per location. Create or select an outlet to continue."
        actionHref="/dashboard/outlets"
        actionLabel="Go to Outlets"
      />
    );
  }

  if (loading) return <RestoLoader message="Setting the tables..." />;

  const closeAlloc = closeTable?.allocations[0];
  const closeItems = (closeAlloc?.order?.items ?? []).filter((i) => !i.voided);
  const closeTotal = orderSubtotal(closeItems);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="Tables & Orders"
        subtitle={`${outlet.name} — dine-in, takeaway, waitlist & reservations — live`}
        icon="tables"
        image="/images/resto-hero.png"
        action={
          <Button
            className="rounded-full bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)] hover:bg-[var(--restaurant-yellow)]/90 font-semibold shadow-md"
            onClick={() => openSeatDialog()}
          >
            Seat Guests
          </Button>
        }
      />

      <Card className="resto-card border-0">
        <CardHeader>
          <CardTitle className="resto-heading text-base">
            {canManageSetup ? "Add Table" : "Table setup"}
          </CardTitle>
        </CardHeader>
        {canManageSetup ? (
          <CardContent className="flex gap-2 flex-wrap">
            <Input
              placeholder="Table label (e.g. T1)"
              value={newTable.label}
              onChange={(e) => setNewTable({ ...newTable, label: e.target.value })}
            />
            <Input
              placeholder="Capacity"
              type="number"
              className="w-24"
              value={newTable.capacity}
              onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
            />
            <Button className="rounded-full" onClick={createTable}>
              Add
            </Button>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Managers add tables. Staff can seat guests and take orders.
            </p>
          </CardContent>
        )}
      </Card>

      <ServiceQueues
        outletId={outlet.id}
        currency={currency}
        menu={menu}
        tables={tables}
        serviceOrders={serviceOrders}
        onChanged={() => load({ silent: true })}
      />

      {tables.length === 0 ? (
        <RestoEmptyState
          icon="tables"
          title="No tables yet"
          description="Add tables, then seat guests and take orders from your menu."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((t, i) => {
            const alloc = t.allocations[0];
            const items = (alloc?.order?.items ?? []).filter((item) => !item.voided);
            const total = orderSubtotal(items);

            return (
              <Card
                key={t.id}
                className={`resto-card border-0 opacity-0 animate-fade-in-up ${
                  t.status === "occupied" ? "ring-2 ring-[var(--restaurant-mustard)]" : ""
                }`}
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="resto-heading text-base">{t.label}</CardTitle>
                    <Badge variant={statusColor[t.status]}>{t.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Seats {t.capacity}</p>

                  {alloc && (
                    <>
                      <p className="text-sm font-medium">
                        {alloc.guestName} · {alloc.guestCount} guests
                      </p>
                      {items.length > 0 ? (
                        <div className="rounded-lg bg-secondary/20 p-2 space-y-1 text-xs">
                          {items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between gap-2 items-center">
                              <span className="truncate">
                                {item.quantity}× {item.name}
                              </span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                {item.kitchenStatus && (
                                  <Badge
                                    variant={kitchenBadgeVariant(item.kitchenStatus)}
                                    className="capitalize text-[10px] px-1.5 py-0"
                                  >
                                    {item.kitchenStatus}
                                  </Badge>
                                )}
                                <span className="font-medium">
                                  {fmt(item.price * item.quantity)}
                                </span>
                              </span>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <p className="text-muted-foreground">+{items.length - 3} more items</p>
                          )}
                          <p className="font-bold text-primary pt-1 border-t border-border/40">
                            Total: {fmt(total)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No order yet</p>
                      )}
                    </>
                  )}

                  <div className="flex flex-col gap-1.5 pt-1">
                    {t.status === "available" && (
                      <Button
                        size="sm"
                        className="w-full rounded-full"
                        onClick={() => openSeatDialog(t.id)}
                      >
                        Seat & order
                      </Button>
                    )}
                    {t.status === "occupied" && alloc && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full rounded-full"
                          onClick={() => openOrderDialog(alloc)}
                        >
                          Add menu items
                        </Button>
                        <Button
                          size="sm"
                          className="w-full rounded-full bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)] hover:bg-[var(--restaurant-yellow)]/90"
                          onClick={() => openClose(t, "settle")}
                          disabled={items.length === 0}
                        >
                          Settle & pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-full"
                          onClick={() => openClose(t, "cancel")}
                        >
                          Cancel seating
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-full text-destructive border-destructive/30"
                          onClick={() => openClose(t, "walkout")}
                        >
                          Walkout / unpaid
                        </Button>
                        {canFinance && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full rounded-full text-xs"
                            onClick={() => openClose(t, "comp")}
                          >
                            Comp (manager)
                          </Button>
                        )}
                      </>
                    )}
                    {canManageSetup && (
                      <DeleteButton
                        label="Delete table"
                        confirmMessage={`Delete table "${t.label}"?`}
                        onDelete={() => deleteTable(t.id, t.label)}
                        className="w-full"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={seatOpen} onOpenChange={setSeatOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="resto-heading">Seat guests & take order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Table</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                value={guest.tableId}
                onChange={(e) => setGuest({ ...guest, tableId: e.target.value })}
              >
                <option value="">Select table</option>
                {tables
                  .filter((t) => t.status === "available")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} (seats {t.capacity})
                    </option>
                  ))}
              </select>
            </div>
            <GuestFields
              guestName={guest.guestName}
              guestCount={guest.guestCount}
              onGuestNameChange={(v) => setGuest({ ...guest, guestName: v })}
              onGuestCountChange={(v) => setGuest({ ...guest, guestCount: v })}
            />
            <MenuOrderPicker
              categories={menu}
              cart={cart}
              onCartChange={setCart}
              currency={currency}
            />
            <Button
              className="w-full rounded-full"
              onClick={seatGuests}
              disabled={submitting}
            >
              {submitting ? "Seating..." : cart.length ? "Seat guests & place order" : "Seat guests"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="resto-heading">
              Order for {activeAllocation?.guestName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {activeAllocation?.order?.items && activeAllocation.order.items.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-semibold">Current order</p>
                {activeAllocation.order.items
                  .filter((i) => !i.voided)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate">
                          {item.quantity}× {item.name} — {fmt(item.price * item.quantity)}
                        </span>
                        {item.kitchenStatus && (
                          <Badge
                            variant={kitchenBadgeVariant(item.kitchenStatus)}
                            className="capitalize shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {item.kitchenStatus}
                          </Badge>
                        )}
                      </span>
                      <DeleteButton
                        label="Remove"
                        confirmMessage={`Remove ${item.name} from order?`}
                        onDelete={async () => {
                          await removeOrderItem(item.id);
                          return true;
                        }}
                      />
                    </div>
                  ))}
                <p className="text-sm font-bold text-right text-primary pt-1 border-t">
                  Total: {fmt(orderSubtotal(activeAllocation.order.items))}
                </p>
              </div>
            )}
            <MenuOrderPicker
              categories={menu}
              cart={addCart}
              onCartChange={setAddCart}
              currency={currency}
            />
            <Button
              className="w-full rounded-full"
              onClick={addItemsToOrder}
              disabled={submitting || addCart.length === 0}
            >
              {submitting ? "Saving..." : "Add to order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!closeMode}
        onOpenChange={(open) => {
          if (!open) {
            setCloseMode(null);
            setCloseTable(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="resto-heading">
              {closeMode === "settle" && `Settle ${closeTable?.label}`}
              {closeMode === "cancel" && `Cancel seating · ${closeTable?.label}`}
              {closeMode === "walkout" && `Walkout · ${closeTable?.label}`}
              {closeMode === "comp" && `Comp · ${closeTable?.label}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {closeAlloc && (
              <p className="text-sm text-muted-foreground">
                {closeAlloc.guestName} · {closeAlloc.guestCount} guests
                {closeItems.length > 0 ? ` · bill ${fmt(closeTotal)}` : " · no items"}
              </p>
            )}

            {closeMode === "settle" && (
              <>
                <p className="text-sm">
                  This adds <strong>{fmt(closeTotal)}</strong> to outlet income and counts as a
                  successful table turn.
                </p>
                <div>
                  <label className="text-sm font-medium">Payment method</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            {closeMode === "cancel" && (
              <p className="text-sm text-muted-foreground">
                Wrong table or guests left before ordering. No income and no successful turn.
              </p>
            )}

            {(closeMode === "walkout" || closeMode === "comp") && (
              <>
                <p className="text-sm text-muted-foreground">
                  Bill will <strong>not</strong> be added to income and will not count as a table
                  turn.
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={recordWaste}
                    onChange={(e) => setRecordWaste(e.target.checked)}
                  />
                  Food was prepared — deduct inventory as waste
                </label>
              </>
            )}

            {closeMode !== "settle" && (
              <div>
                <label className="text-sm font-medium">Reason (required)</label>
                <Input
                  className="mt-1"
                  placeholder={
                    closeMode === "cancel"
                      ? "e.g. Guest left / wrong table"
                      : closeMode === "comp"
                        ? "e.g. Owner guest"
                        : "e.g. Refused to pay / emergency"
                  }
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                />
              </div>
            )}

            <Button
              className="w-full rounded-full"
              variant={closeMode === "walkout" ? "destructive" : "default"}
              onClick={confirmClose}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : closeMode === "settle"
                  ? `Confirm payment · ${fmt(closeTotal)}`
                  : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
