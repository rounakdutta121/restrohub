"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { ReadOnlyNotice } from "@/components/brand/role-badge";
import { fetchJson } from "@/lib/fetch-json";
import { formatCurrency } from "@/lib/currency";
import { RestoLoader } from "@/components/ui/resto-loader";
import { RestoEmptyState } from "@/components/brand/page-header";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-errors";
import QRCode from "qrcode";

interface MenuCategory {
  id: string;
  name: string;
  items: { id: string; name: string; description: string | null; price: number; isAvailable: boolean }[];
}

export default function MenusPage() {
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canEdit = can("manageMenus");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [catName, setCatName] = useState("");
  const [itemForm, setItemForm] = useState({ categoryId: "", name: "", price: "", description: "" });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!outlet) return;
    setLoading(true);
    setQrDataUrl(null);
    fetchJson<MenuCategory[]>(`/api/outlets/${outlet.id}/menus`).then((d) => {
      if (Array.isArray(d)) setCategories(d);
      setLoading(false);
    });
  }, [outlet]);

  useEffect(() => {
    if (!outlet || loading) return;
    const itemCount = categories.reduce((n, c) => n + c.items.length, 0);
    if (itemCount === 0) {
      setQrDataUrl(null);
      return;
    }

    const url = `${window.location.origin}/m/${outlet.slug}`;

    QRCode.toDataURL(url, {
      width: 180,
      margin: 2,
      color: { dark: "#3d2314", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => toast.error("Could not generate QR code"));
  }, [outlet, loading, categories]);

  async function addCategory() {
    if (!outlet || !catName) return;
    const res = await fetch(`/api/outlets/${outlet.id}/menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", categoryName: catName }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((prev) => [...prev, { ...data, items: [] }]);
      setCatName("");
      toast.success("Category added");
    }
  }

  async function addItem() {
    if (!outlet || !itemForm.categoryId) return;
    const res = await fetch(`/api/outlets/${outlet.id}/menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "item", ...itemForm }),
    });
    const data = await res.json();
    if (!res.ok) {
      toastApiError(data.error);
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === itemForm.categoryId ? { ...c, items: [...c.items, data] } : c
      )
    );
    setItemForm({ categoryId: "", name: "", price: "", description: "" });
    toast.success("Item added");
  }

  async function deleteCategory(categoryId: string, name: string) {
    if (!outlet) return false;
    const ok = await apiDelete(`/api/outlets/${outlet.id}/menus`, { type: "category", id: categoryId });
    if (ok) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      toast.success(`Deleted category "${name}"`);
    }
    return ok;
  }

  async function deleteItem(categoryId: string, itemId: string, name: string) {
    if (!outlet) return false;
    const ok = await apiDelete(`/api/outlets/${outlet.id}/menus`, { type: "item", id: itemId });
    if (ok) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
        )
      );
      toast.success(`Deleted "${name}"`);
    }
    return ok;
  }

  function downloadQR() {
    if (!qrDataUrl || !outlet) return;
    const link = document.createElement("a");
    link.download = `${outlet.slug}-menu-qr.png`;
    link.href = qrDataUrl;
    link.click();
  }

  if (!outlet) {
    return (
      <RestoEmptyState
        icon="menus"
        title="Add an outlet first"
        description="Menus are per location. Create an outlet, then build categories and items."
        actionHref="/dashboard/outlets"
        actionLabel="Go to Outlets"
      />
    );
  }

  if (loading) return <RestoLoader message="Loading your menu..." />;

  const itemCount = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="resto-card p-0 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative h-40 md:h-auto min-h-[160px]">
            <Image src="/images/resto-food-spread.png" alt="Menu" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-primary/30" />
          </div>
          <div className="p-6 flex flex-col justify-center">
            <h1 className="resto-heading text-2xl font-bold text-[var(--restaurant-brown)]">Menus</h1>
            <p className="text-sm text-muted-foreground">{outlet.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tip: add a category first, then menu items. Guests see prices in {outlet.currency}.
            </p>
            {itemCount > 0 ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="text-center">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${outlet.name} menu`}
                      width={180}
                      height={180}
                      className="rounded-lg border-2 border-secondary shadow-md bg-white"
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] rounded-lg border-2 border-secondary bg-white animate-shimmer" />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 rounded-full"
                    onClick={downloadQR}
                    disabled={!qrDataUrl}
                  >
                    Download QR
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Guests scan to view:</p>
                  <a href={`/m/${outlet.slug}`} target="_blank" className="text-primary font-medium underline">
                    /m/{outlet.slug}
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--restaurant-mustard)]/50 bg-[var(--restaurant-mustard)]/10 p-4 text-sm text-muted-foreground">
                Add at least one menu item to unlock the guest QR code.
              </div>
            )}
          </div>
        </div>
      </div>

      {!canEdit && (
        <ReadOnlyNotice message="Ask a manager to add or change menu items." />
      )}

      {categories.length === 0 && canEdit && (
        <RestoEmptyState
          icon="menus"
          title="No menu categories yet"
          description="Start with something simple like Starters, Mains, or Beverages."
        />
      )}

      {canEdit && (
      <Card className="resto-card">
        <CardHeader><CardTitle className="text-base">Add Category</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Category name (e.g. Starters)" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <Button onClick={addCategory}>Add</Button>
        </CardContent>
      </Card>
      )}

      {canEdit && (
      <Card className="resto-card">
        <CardHeader><CardTitle className="text-base">Add Menu Item</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={itemForm.categoryId}
            onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Item name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
          <Input placeholder="Price" type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
          <Input placeholder="Description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
          <Button onClick={addItem}>Add Item</Button>
        </CardContent>
      </Card>
      )}

      {categories.map((cat) => (
        <Card key={cat.id} className="resto-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{cat.name}</CardTitle>
            {canEdit && (
            <DeleteButton
              label="Delete category"
              confirmMessage={`Delete "${cat.name}" and all its menu items?`}
              onDelete={() => deleteCategory(cat.id, cat.name)}
            />
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {cat.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items yet.</p>
            ) : (
              cat.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(item.price, outlet.currency)}</span>
                    <Badge variant={item.isAvailable ? "default" : "secondary"}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                    {canEdit && (
                    <DeleteButton
                      label="Delete"
                      confirmMessage={`Delete menu item "${item.name}"?`}
                      onDelete={() => deleteItem(cat.id, item.id, item.name)}
                    />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
