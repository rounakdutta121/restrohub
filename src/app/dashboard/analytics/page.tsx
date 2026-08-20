"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from "@/hooks/use-organization";
import { useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDenied } from "@/components/brand/role-badge";
import { RestoPageHeader, RestoEmptyState } from "@/components/brand/page-header";
import { RestoLoader } from "@/components/ui/resto-loader";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";

type AnalyticsPayload = {
  range: { from: string; to: string };
  outlets: { id: string; name: string; currency: string }[];
  kpis: {
    dailyRevenue: number;
    periodRevenue: number;
    income: number;
    expense: number;
    profit: number;
    covers: number;
    turns: number;
    avgCheck: number;
    walkouts: number;
    voids: number;
    cancels: number;
    comps: number;
  };
  growth: { revenuePct: number | null; turnsPct: number | null };
  byOutlet: {
    outletId: string;
    name: string;
    currency: string;
    opsRevenue: number;
    income: number;
    expense: number;
    profit: number;
    turns: number;
  }[];
  revenueByDay: { date: string; revenue: number }[];
  incomeVsExpense: { date: string; income: number; expense: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  byHour: { hour: number; revenue: number; orders: number }[];
  byTable: { tableId: string; label: string; turns: number; revenue: number }[];
  integrity: { walkouts: number; voids: number; cancels: number; comps: number };
  visits: {
    orderId: string;
    paidAt: string | null;
    subtotal: number;
    paymentMethod: string | null;
    guestName: string;
    guestCount: number;
    tableLabel: string;
    outletId: string;
    items: { name: string; quantity: number; price: number }[];
  }[];
  lowStock: {
    outletId: string;
    name: string;
    quantity: number;
    reorderLevel: number;
    unit: string;
  }[];
  cogsComplete: boolean;
};

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AnalyticsPage() {
  const { organization } = useOrganization();
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const canView = can("viewFinance");
  const canVoid = can("manageFinance");
  const [range, setRange] = useState(defaultRange);
  const [filterOutlet, setFilterOutlet] = useState<string>("");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidingId, setVoidingId] = useState<string | null>(null);

  useEffect(() => {
    if (outlet?.id && !filterOutlet) setFilterOutlet(outlet.id);
  }, [outlet?.id]);

  function load() {
    if (!organization || !canView) return;
    setLoading(true);
    const qs = new URLSearchParams({
      from: range.from,
      to: range.to,
    });
    if (filterOutlet) qs.set("outletId", filterOutlet);
    fetch(`/api/workspaces/${organization.id}/analytics?${qs}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [organization?.id, range.from, range.to, filterOutlet, canView]);

  const currency = useMemo(() => {
    if (!data?.outlets?.length) return outlet?.currency ?? "INR";
    const match = data.outlets.find((o) => o.id === filterOutlet);
    return match?.currency ?? data.outlets[0]?.currency ?? "INR";
  }, [data, filterOutlet, outlet?.currency]);

  const fmt = (n: number) => formatCurrency(n, currency);

  async function voidOrder(orderId: string, orderOutletId: string) {
    if (!voidReason.trim()) {
      toast.error("Reason required to void");
      return;
    }
    setVoidingId(orderId);
    const res = await fetch(`/api/outlets/${orderOutletId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void_order", orderId, reason: voidReason.trim() }),
    });
    setVoidingId(null);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not void order");
      return;
    }
    toast.success("Order voided — income reversed");
    setVoidReason("");
    setExpanded(null);
    load();
  }

  if (!canView) {
    return (
      <AccessDenied
        title="Analytics restricted"
        description="Only managers and above can view revenue analytics."
      />
    );
  }

  if (!organization) {
    return (
      <RestoEmptyState
        icon="chart"
        title="No organization"
        description="Create or join an organization to see analytics."
      />
    );
  }

  if (loading && !data) return <RestoLoader message="Loading analytics..." />;

  const k = data?.kpis;
  const g = data?.growth;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="Analytics"
        subtitle="Paid table sales, growth, and ops integrity — cancels and walkouts never inflate revenue"
        icon="chart"
        image="/images/resto-hero.png"
      />

      <Card className="resto-card border-0">
        <CardContent className="pt-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Outlet</label>
            <select
              className="w-full min-w-[160px] border rounded-md px-3 py-2 text-sm"
              value={filterOutlet}
              onChange={(e) => setFilterOutlet(e.target.value)}
            >
              <option value="">All outlets</option>
              {(data?.outlets || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {data?.integrity && (
        <p className="text-sm text-muted-foreground rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
          Integrity: {data.integrity.walkouts} walkouts, {data.integrity.voids} voids,{" "}
          {data.integrity.cancels} cancels, {data.integrity.comps} comps this period — excluded
          from revenue
          {!data.cogsComplete && " · Recipe lines incomplete (COGS not estimated)"}
        </p>
      )}

      {k && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today's revenue", value: fmt(k.dailyRevenue) },
            { label: "Period ops sales", value: fmt(k.periodRevenue) },
            {
              label: "P&L profit",
              value: fmt(k.profit),
              sub: `${fmt(k.income)} in · ${fmt(k.expense)} out`,
            },
            {
              label: "Growth vs prior",
              value:
                g?.revenuePct == null ? "—" : `${g.revenuePct > 0 ? "+" : ""}${g.revenuePct}%`,
              sub:
                g?.turnsPct == null
                  ? undefined
                  : `Turns ${g.turnsPct > 0 ? "+" : ""}${g.turnsPct}%`,
            },
            { label: "Table turns", value: String(k.turns) },
            { label: "Covers", value: String(k.covers) },
            { label: "Avg check", value: fmt(k.avgCheck) },
            {
              label: "Walkouts / voids",
              value: `${k.walkouts} / ${k.voids}`,
            },
          ].map((card) => (
            <Card key={card.label} className="resto-card border-0">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold text-[var(--restaurant-brown)]">{card.value}</p>
                {"sub" in card && card.sub && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Revenue over time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3d2314"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Income vs expense</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.incomeVsExpense || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
                <Bar dataKey="income" fill="#5a8f4a" name="Income" />
                <Bar dataKey="expense" fill="#c45c26" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Peak hours</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byHour || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="revenue" fill="#c9a227" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Top menu items</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={(data?.topItems || []).slice(0, 8)}
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="revenue" fill="#3d2314" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {!filterOutlet && (data?.byOutlet?.length ?? 0) > 0 && (
        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Outlet breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data!.byOutlet.map((o) => (
              <div
                key={o.outletId}
                className="flex flex-wrap justify-between gap-2 py-2 border-b last:border-0 text-sm"
              >
                <span className="font-medium">{o.name}</span>
                <span>
                  {formatCurrency(o.opsRevenue, o.currency)} sales · {o.turns} turns · profit{" "}
                  {formatCurrency(o.profit, o.currency)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(data?.byTable?.length ?? 0) > 0 && (
        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Per-table performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data!.byTable.slice(0, 15).map((t) => (
              <div
                key={t.tableId}
                className="flex justify-between text-sm py-1.5 border-b last:border-0"
              >
                <span>{t.label}</span>
                <span>
                  {t.turns} turns · {fmt(t.revenue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(data?.lowStock?.length ?? 0) > 0 && (
        <Card className="resto-card border-0">
          <CardHeader>
            <CardTitle className="resto-heading text-base">Low stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data!.lowStock.map((s, i) => (
              <p key={`${s.name}-${i}`}>
                {s.name}: {s.quantity} {s.unit} (min {s.reorderLevel})
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="resto-card border-0">
        <CardHeader>
          <CardTitle className="resto-heading text-base">Paid visits (drill-down)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.visits?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No paid visits in this range. Settle & pay on Tables to populate analytics.
            </p>
          ) : (
            data!.visits.map((v) => (
              <div key={v.orderId} className="border rounded-lg p-3 text-sm space-y-2">
                <button
                  type="button"
                  className="w-full flex justify-between gap-2 text-left"
                  onClick={() => setExpanded(expanded === v.orderId ? null : v.orderId)}
                >
                  <span>
                    {v.tableLabel} · {v.guestName} ({v.guestCount}) ·{" "}
                    {v.paidAt ? new Date(v.paidAt).toLocaleString() : "—"}
                  </span>
                  <span className="font-semibold">{fmt(v.subtotal)}</span>
                </button>
                {expanded === v.orderId && (
                  <div className="pt-2 border-t space-y-2">
                    {v.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {item.quantity}× {item.name}
                        </span>
                        <span>{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {canVoid && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Input
                          placeholder="Void reason (required)"
                          value={voidReason}
                          onChange={(e) => setVoidReason(e.target.value)}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-full shrink-0"
                          disabled={voidingId === v.orderId}
                          onClick={() => voidOrder(v.orderId, v.outletId)}
                        >
                          {voidingId === v.orderId ? "Voiding..." : "Void bill"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
