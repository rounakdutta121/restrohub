"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Search } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export interface MenuCategory {
  id: string;
  name: string;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isAvailable: boolean;
  }[];
}

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export function orderTotal(items: { price: number; quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function MenuOrderPicker({
  categories,
  cart,
  onCartChange,
  currency,
}: {
  categories: MenuCategory[];
  cart: CartLine[];
  onCartChange: (cart: CartLine[]) => void;
  currency: string;
}) {
  const [query, setQuery] = useState("");

  const available = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          items: c.items.filter((i) => i.isAvailable),
        }))
        .filter((c) => c.items.length > 0),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            (i.description?.toLowerCase().includes(q) ?? false)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [available, query]);

  const flatMatches = useMemo(
    () => filtered.flatMap((c) => c.items),
    [filtered]
  );

  function addItem(item: MenuCategory["items"][0]) {
    const existing = cart.find((c) => c.menuItemId === item.id);
    if (existing) {
      onCartChange(
        cart.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      onCartChange([
        ...cart,
        { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 },
      ]);
    }
  }

  function changeQty(menuItemId: string, delta: number) {
    onCartChange(
      cart
        .map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (flatMatches[0]) {
      addItem(flatMatches[0]);
      setQuery("");
    }
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
        No menu items yet. Add items in the Menus section first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Add from menu</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search dishes… (Enter adds first match)"
            className="pl-9"
            autoComplete="off"
          />
        </div>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border divide-y">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">
              No items match “{query.trim()}”
            </p>
          ) : (
            filtered.map((cat) => (
              <div key={cat.id}>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide bg-muted/50 text-muted-foreground sticky top-0">
                  {cat.name}
                </p>
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary/30 transition-colors"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-primary font-semibold shrink-0">
                      {formatCurrency(item.price, currency)}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="rounded-lg border bg-secondary/10 p-3 space-y-2">
          <p className="text-sm font-semibold">Order ({cart.length} items)</p>
          {cart.map((line) => (
            <div key={line.menuItemId} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex-1 truncate">{line.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => changeQty(line.menuItemId, -1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-medium">{line.quantity}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => changeQty(line.menuItemId, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="w-16 text-right font-semibold text-primary shrink-0">
                {formatCurrency(line.price * line.quantity, currency)}
              </span>
            </div>
          ))}
          <p className="text-sm font-bold text-right pt-1 border-t">
            Total: {formatCurrency(orderTotal(cart), currency)}
          </p>
        </div>
      )}
    </div>
  );
}

export function GuestFields({
  guestName,
  guestCount,
  onGuestNameChange,
  onGuestCountChange,
}: {
  guestName: string;
  guestCount: string;
  onGuestNameChange: (v: string) => void;
  onGuestCountChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 sm:col-span-1">
        <Label>Guest name</Label>
        <Input
          placeholder="Guest name"
          value={guestName}
          onChange={(e) => onGuestNameChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label>Party size</Label>
        <Input
          placeholder="Party size"
          type="number"
          min={1}
          value={guestCount}
          onChange={(e) => onGuestCountChange(e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  );
}
