"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { ReadOnlyNotice } from "@/components/brand/role-badge";
import { fetchJson } from "@/lib/fetch-json";
import { formatQuantity } from "@/lib/units";
import { RestoLoader } from "@/components/ui/resto-loader";
import { RestoEmptyState } from "@/components/brand/page-header";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-errors";
import { useOutletLive } from "@/hooks/use-outlet-live";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Stock {
  id: string;
  quantity: number;
  reorderLevel: number;
  ingredient: Ingredient;
}

interface MenuItemOption {
  id: string;
  name: string;
}

interface RecipeLine {
  id: string;
  quantity: number;
  ingredient: Ingredient;
  menuItem: { id: string; name: string };
}

function getStockMessage(quantity: number, minimum: number, unit: string) {
  if (quantity <= 0) {
    return { label: "Out of stock", hint: "Buy more immediately", variant: "destructive" as const };
  }
  if (quantity < minimum) {
    return { label: "Running low", hint: `Below minimum of ${formatQuantity(minimum, unit)}`, variant: "secondary" as const };
  }
  if (quantity === minimum) {
    return { label: "At minimum", hint: "Consider restocking soon", variant: "secondary" as const };
  }
  return { label: "Enough", hint: "Stock is healthy", variant: "default" as const };
}

export default function InventoryPage() {
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canEdit = can("manageInventory");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [recipes, setRecipes] = useState<RecipeLine[]>([]);
  const [newIng, setNewIng] = useState({ name: "", unit: "kg" });
  const [adjust, setAdjust] = useState({ ingredientId: "", quantity: "", minimum: "5" });
  const [recipeForm, setRecipeForm] = useState({
    menuItemId: "",
    ingredientId: "",
    quantity: "",
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!outlet) return;
      if (!opts?.silent) setLoading(true);
      const d = await fetchJson<{
        ingredients: Ingredient[];
        stock: Stock[];
        menuItems?: MenuItemOption[];
        recipes?: RecipeLine[];
      }>(`/api/outlets/${outlet.id}/inventory`);
      if (d) {
        setIngredients(d.ingredients || []);
        setStock(d.stock || []);
        setMenuItems(d.menuItems || []);
        setRecipes(d.recipes || []);
      }
      if (!opts?.silent) setLoading(false);
    },
    [outlet]
  );

  useEffect(() => {
    load();
  }, [load]);

  useOutletLive(outlet?.id, () => {
    void load({ silent: true });
  });

  function onSelectIngredient(id: string) {
    const existing = stock.find((s) => s.ingredient.id === id);
    setAdjust({
      ingredientId: id,
      quantity: existing ? String(existing.quantity) : "",
      minimum: existing ? String(existing.reorderLevel) : "5",
    });
  }

  async function createIngredient() {
    if (!outlet || !newIng.name.trim()) {
      toast.error("Enter an ingredient name");
      return;
    }
    const res = await fetch(`/api/outlets/${outlet.id}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_ingredient", ...newIng }),
    });
    if (res.ok) {
      const name = newIng.name;
      setNewIng({ name: "", unit: "kg" });
      load();
      toast.success(`Added "${name}" to your ingredient list`);
    } else {
      const data = await res.json().catch(() => ({}));
      toastApiError(data.error);
    }
  }

  async function updateStock() {
    if (!outlet || !adjust.ingredientId) {
      toast.error("Pick an ingredient first");
      return;
    }
    const res = await fetch(`/api/outlets/${outlet.id}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_stock",
        ingredientId: adjust.ingredientId,
        quantity: adjust.quantity,
        reorderLevel: adjust.minimum,
      }),
    });
    if (res.ok) {
      load();
      toast.success("Stock saved for this outlet");
    }
  }

  async function deleteIngredient(ingredientId: string, name: string) {
    if (!outlet) return false;
    const ok = await apiDelete(`/api/outlets/${outlet.id}/inventory`, {
      action: "delete_ingredient",
      ingredientId,
    });
    if (ok) {
      load();
      toast.success(`Deleted ingredient "${name}"`);
    }
    return ok;
  }

  async function clearStock(ingredientId: string, name: string) {
    if (!outlet) return false;
    const ok = await apiDelete(`/api/outlets/${outlet.id}/inventory`, {
      action: "delete_stock",
      ingredientId,
    });
    if (ok) {
      load();
      toast.success(`Cleared stock for "${name}"`);
    }
    return ok;
  }

  async function addRecipeLine() {
    if (!outlet || !recipeForm.menuItemId || !recipeForm.ingredientId || !recipeForm.quantity) {
      toast.error("Pick a menu item, ingredient, and quantity");
      return;
    }
    const res = await fetch(`/api/outlets/${outlet.id}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_recipe_line", ...recipeForm }),
    });
    if (res.ok) {
      setRecipeForm({ menuItemId: "", ingredientId: "", quantity: "" });
      load();
      toast.success("Recipe line added — stock will deduct on Settle & pay");
    } else {
      const data = await res.json().catch(() => ({}));
      toastApiError(data.error);
    }
  }

  async function deleteRecipeLine(id: string) {
    if (!outlet) return false;
    const ok = await apiDelete(`/api/outlets/${outlet.id}/inventory`, {
      action: "delete_recipe_line",
      recipeLineId: id,
    });
    if (ok) {
      load();
      toast.success("Recipe line removed");
    }
    return ok;
  }

  if (!outlet) {
    return (
      <RestoEmptyState
        icon="stock"
        title="Add an outlet first"
        description="Inventory is tracked per location. Create or select an outlet to manage stock."
        actionHref="/dashboard/outlets"
        actionLabel="Go to Outlets"
      />
    );
  }

  if (loading) return <RestoLoader message="Checking the pantry..." />;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Ingredients & Stock</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track what you have in the kitchen at <strong>{outlet.name}</strong>.
        </p>
      </div>

      <Card className="resto-card bg-secondary/20 border-dashed">
        <CardContent className="pt-4 text-sm text-muted-foreground space-y-1">
          <p><strong>How it works:</strong></p>
          <p>1. Add an ingredient once (e.g. flour, tea, oil)</p>
          <p>2. Set how much you currently have at this outlet</p>
          <p>3. Set a minimum amount — we alert you when stock drops below it</p>
          <p>4. Link menu items to ingredients (recipes) so Settle &amp; pay deducts stock</p>
        </CardContent>
      </Card>

      {!canEdit && (
        <ReadOnlyNotice message="Ask a manager to update ingredients and stock levels." />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {canEdit && (
        <div className="space-y-6">
      <Card className="resto-card">
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Add a new ingredient</CardTitle>
          <CardDescription>
            This creates the item for your whole business. You only need to do this once per ingredient.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Ingredient name</Label>
            <Input
              placeholder="e.g. flour, tea, cooking oil"
              value={newIng.name}
              onChange={(e) => setNewIng({ ...newIng, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Measured in</Label>
            <Input
              placeholder="kg, litres, pieces"
              value={newIng.unit}
              onChange={(e) => setNewIng({ ...newIng, unit: e.target.value.replace(/^[\d.]+/, "") })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Unit only — e.g. kg, litres, pieces (no numbers)</p>
          </div>
          <Button onClick={createIngredient}>Add ingredient</Button>
        </CardContent>
      </Card>

      <Card className="resto-card">
        <CardHeader>
          <CardTitle className="text-base">Step 2 — Update stock at this outlet</CardTitle>
          <CardDescription>
            Tell us how much you have right now and the minimum you want to keep.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Ingredient</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              value={adjust.ingredientId}
              onChange={(e) => onSelectIngredient(e.target.value)}
            >
              <option value="">Choose an ingredient...</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
              ))}
            </select>
          </div>
          <div>
            <Label>How much do you have now?</Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 10 or 1.5"
              value={adjust.quantity}
              onChange={(e) => setAdjust({ ...adjust, quantity: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Current amount in your kitchen</p>
          </div>
          <div>
            <Label>Minimum to keep (alert below this)</Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 5 or 2.5"
              value={adjust.minimum}
              onChange={(e) => setAdjust({ ...adjust, minimum: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: if minimum is 5 kg and you have 3 kg, you&apos;ll get a low-stock alert
            </p>
          </div>
          <Button onClick={updateStock}>Save stock</Button>
        </CardContent>
      </Card>

      <Card className="resto-card">
        <CardHeader>
          <CardTitle className="text-base">Recipes — link menu items to ingredients</CardTitle>
          <CardDescription>
            When a table bill is settled, these quantities deduct from stock. Walkouts can deduct as
            waste if you check that option.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Menu item</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              value={recipeForm.menuItemId}
              onChange={(e) => setRecipeForm({ ...recipeForm, menuItemId: e.target.value })}
            >
              <option value="">Choose menu item...</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Ingredient</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm mt-1"
              value={recipeForm.ingredientId}
              onChange={(e) => setRecipeForm({ ...recipeForm, ingredientId: e.target.value })}
            >
              <option value="">Choose ingredient...</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Qty per serving</Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 0.2"
              value={recipeForm.quantity}
              onChange={(e) => setRecipeForm({ ...recipeForm, quantity: e.target.value })}
              className="mt-1"
            />
          </div>
          <Button onClick={addRecipeLine}>Add recipe line</Button>
          {recipes.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              {recipes.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm gap-2">
                  <span>
                    {r.menuItem.name} ← {r.quantity} {r.ingredient.unit} {r.ingredient.name}
                  </span>
                  <DeleteButton
                    label="Remove"
                    confirmMessage="Remove this recipe line?"
                    onDelete={() => deleteRecipeLine(r.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
        )}

      <Card className={`resto-card ${canEdit ? "lg:row-span-2" : ""}`}>
        <CardHeader>
          <CardTitle className="text-base">Current stock — {outlet.name}</CardTitle>
          <CardDescription>Live view of what&apos;s in this outlet&apos;s kitchen</CardDescription>
        </CardHeader>
        <CardContent>
          {stock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing tracked yet. Add an ingredient above, then save its stock.
            </p>
          ) : (
            <div className="space-y-3">
              {stock.map((s) => {
                const status = getStockMessage(s.quantity, s.reorderLevel, s.ingredient.unit);
                return (
                  <div key={s.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium capitalize">{s.ingredient.name}</p>
                        <p className="text-sm mt-1">
                          You have:{" "}
                          <strong>{formatQuantity(s.quantity, s.ingredient.unit)}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Alert when below {formatQuantity(s.reorderLevel, s.ingredient.unit)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <p className="text-xs text-muted-foreground">{status.hint}</p>
                        {canEdit && (
                        <>
                        <DeleteButton
                          label="Clear stock"
                          confirmMessage={`Remove stock tracking for "${s.ingredient.name}" at this outlet?`}
                          onDelete={() => clearStock(s.ingredient.id, s.ingredient.name)}
                        />
                        <DeleteButton
                          label="Delete ingredient"
                          confirmMessage={`Delete "${s.ingredient.name}" from your entire business? This removes it from all outlets.`}
                          onDelete={() => deleteIngredient(s.ingredient.id, s.ingredient.name)}
                        />
                        </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
