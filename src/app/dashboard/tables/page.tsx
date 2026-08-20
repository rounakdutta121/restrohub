"use client";

import { useEffect, useState } from "react";
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
import { usePermissions } from "@/hooks/use-permissions";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import {
  MenuOrderPicker,
  GuestFields,
  orderTotal,
  type MenuCategory,
  type CartLine,
} from "@/components/tables/menu-order-picker";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Allocation {
  id: string;
  guestName: string;
  guestCount: number;
  order?: { id: string; items: OrderItem[] } | null;
}

interface Table {
  id: string;
  label: string;
  capacity: number;
  status: string;
  allocations: Allocation[];
}

const emptyGuest = { tableId: "", guestName: "", guestCount: "2" };

export default function TablesPage() {
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canManageSetup = can("manageTableSetup");
  const [tables, setTables] = useState<Table[]>([]);
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

  function load() {
    if (!outlet) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/outlets/${outlet.id}/tables`).then((r) => r.json()),
      fetch(`/api/outlets/${outlet.id}/menus`).then((r) => r.json()),
    ])
      .then(([tablesData, menuData]) => {
        if (Array.isArray(tablesData)) setTables(tablesData);
        if (Array.isArray(menuData)) setMenu(menuData);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [outlet]);

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

  async function freeTable(tableId: string) {
    if (!outlet) return;
    await fetch(`/api/outlets/${outlet.id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "free_table", tableId }),
    });
    load();
    toast.success("Table freed");
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

  return (
    <div className="space-y-6 w-full animate-fade-in">
        <RestoPageHeader
          title="Tables & Orders"
          subtitle={`${outlet.name} — seat guests and take orders from your menu`}
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
          <CardTitle className="resto-heading text-base">{canManageSetup ? "Add Table" : "Table setup"}</CardTitle>
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
          <p className="text-sm text-muted-foreground">Managers add tables. Staff can seat guests and take orders.</p>
        </CardContent>
        )}
      </Card>

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
            const items = alloc?.order?.items ?? [];
            const total = orderTotal(items);

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
                            <div key={item.id} className="flex justify-between gap-2">
                              <span className="truncate">
                                {item.quantity}× {item.name}
                              </span>
                              <span className="font-medium shrink-0">
                                {fmt(item.price * item.quantity)}
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
                          variant="outline"
                          className="w-full rounded-full"
                          onClick={() => freeTable(t.id)}
                        >
                          Free table
                        </Button>
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

      {/* Seat guests + initial order */}
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

      {/* Add items to existing order */}
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
                {activeAllocation.order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {item.quantity}× {item.name} — {fmt(item.price * item.quantity)}
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
                  Total: {orderTotal(activeAllocation.order.items) > 0
                    ? fmt(orderTotal(activeAllocation.order.items))
                    : fmt(0)}
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
    </div>
  );
}
