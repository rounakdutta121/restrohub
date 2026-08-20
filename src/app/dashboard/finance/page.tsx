"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDenied } from "@/components/brand/role-badge";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { DeleteButton, apiDelete } from "@/components/ui/delete-button";
import { formatCurrency, formatSignedCurrency } from "@/lib/currency";
import { toast } from "sonner";

interface FinanceEntry {
  id: string;
  type: string;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  sourceType?: string;
  voidedAt?: string | null;
}

interface Summary {
  income: number;
  expense: number;
  profit: number;
  month: number;
  year: number;
}

export default function FinancePage() {
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canView = can("viewFinance");
  const canEdit = can("manageFinance");
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    category: "sales",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  function load() {
    if (!outlet) return;
    setLoading(true);
    fetch(`/api/outlets/${outlet.id}/finance`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || []);
        setSummary(d.summary);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [outlet]);

  async function addEntry() {
    if (!outlet) return;
    const res = await fetch(`/api/outlets/${outlet.id}/finance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      load();
      setForm({ ...form, amount: "", note: "" });
      toast.success("Entry added");
    }
  }

  async function deleteEntry(id: string) {
    if (!outlet) return false;
    const ok = await apiDelete(`/api/outlets/${outlet.id}/finance`, { id });
    if (ok) {
      load();
      toast.success("Entry deleted");
    }
    return ok;
  }

  if (!outlet) {
    return (
      <RestoEmptyState
        icon="finance"
        title="Add an outlet first"
        description="Finance is tracked per location. Create or select an outlet from the header."
        actionHref="/dashboard/outlets"
        actionLabel="Go to Outlets"
      />
    );
  }

  if (!canView) {
    return (
      <AccessDenied
        title="Finance access restricted"
        description="Only managers and above can view income, expenses, and profit data."
      />
    );
  }

  if (loading) return <RestoLoader message="Crunching the numbers..." />;

  const currency = outlet.currency;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="Finance"
        subtitle={`${outlet.name} — table sales auto-post on settle; add rent, salaries, and other entries manually`}
        icon="finance"
        image="/images/resto-hero.png"
      />

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Income", value: summary.income, color: "text-green-700", bg: "bg-green-50" },
            { label: "Expense", value: summary.expense, color: "text-primary", bg: "bg-primary/5" },
            { label: "Profit", value: summary.profit, color: "text-[var(--restaurant-brown)]", bg: "bg-secondary/30" },
          ].map((s, i) => (
            <Card
              key={s.label}
              className={`resto-card border-0 ${s.bg} opacity-0 animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "forwards" }}
            >
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{formatCurrency(s.value, currency)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canEdit && (
      <Card className="resto-card border-0">
        <CardHeader><CardTitle className="resto-heading text-base">Add Entry</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Category</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {["sales", "rent", "utilities", "salaries", "ingredients", "misc"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <Input placeholder="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Button className="rounded-full" onClick={addEntry}>Add Entry</Button>
        </CardContent>
      </Card>
      )}

      <Card className="resto-card border-0">
        <CardHeader><CardTitle className="resto-heading">Recent Entries</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {entries.length === 0 ? (
            <RestoEmptyState icon="chart" title="No entries this month" description="Log your first sale or expense above." />
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm gap-4">
                <div className={e.voidedAt ? "opacity-50 line-through" : ""}>
                  <span className="font-medium capitalize">{e.category}</span>
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {e.sourceType === "order"
                      ? "Table sale"
                      : e.sourceType === "adjustment"
                        ? "Void adj."
                        : "Manual"}
                  </span>
                  {e.note && <span className="text-muted-foreground ml-2">{e.note}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={e.type === "income" ? "text-green-600 font-semibold" : "text-primary font-semibold"}>
                    {formatSignedCurrency(e.amount, currency, e.type === "income" ? "+" : "-")}
                  </span>
                  {canEdit && e.sourceType === "manual" && !e.voidedAt && (
                  <DeleteButton
                    label="Delete"
                    confirmMessage="Delete this finance entry?"
                    onDelete={() => deleteEntry(e.id)}
                  />
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
