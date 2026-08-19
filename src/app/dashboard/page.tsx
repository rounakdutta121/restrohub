"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/use-organization";
import { useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { fetchJson } from "@/lib/fetch-json";
import { formatCurrency } from "@/lib/currency";
import { RestoLoader, RestoCardSkeleton } from "@/components/ui/resto-loader";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";

interface DashboardData {
  outlets: { id: string; name: string; city: string | null }[];
  complianceRate: number;
  overdueRuns: number;
  lowStockCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyProfit: number;
  recentRuns: {
    id: string;
    status: string;
    sop: { title: string };
    assignedTo: { name: string | null; email: string };
    outlet?: { name: string } | null;
  }[];
}

export default function DashboardPage() {
  const { organization } = useOrganization();
  const { outlet } = useOutlet();
  const { can } = usePermissions();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!organization) return;
    const params = new URLSearchParams({ workspaceId: organization.id });
    if (outlet) params.set("outletId", outlet.id);
    fetchJson<DashboardData>(`/api/dashboard?${params}`).then(setData);
  }, [organization, outlet]);

  if (!organization) {
    return (
      <div className="resto-card p-0 overflow-hidden w-full mt-10 animate-fade-in-up">
        <div className="relative h-40">
          <Image src="/images/resto-kitchen.png" alt="Welcome" fill className="object-cover" />
          <div className="absolute inset-0 bg-primary/40" />
        </div>
        <div className="p-8 text-center">
          <h2 className="resto-heading text-xl font-bold">Welcome to RestoHub!</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Create your restaurant organization to get started.
          </p>
          <Link href="/dashboard/settings" className="inline-block mt-4 text-primary font-semibold hover:underline">
            Go to Settings →
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <RestoCardSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <RestoCardSkeleton key={i} />)}
        </div>
        <RestoLoader message="Loading your kitchen stats..." />
      </div>
    );
  }

  const stats: { icon: RestoIconName; label: string; value: string | number; color: string }[] = [
    { icon: "outlets", label: "Outlets", value: data.outlets.length, color: "bg-secondary/40" },
    { icon: "prep", label: "Compliance", value: `${data.complianceRate}%`, color: "bg-accent/60" },
    { icon: "stock", label: "Low Stock", value: data.lowStockCount, color: "bg-primary/10" },
    { icon: "clock", label: "Overdue", value: data.overdueRuns, color: "bg-secondary/40" },
  ];

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="resto-card p-0 overflow-hidden">
        <div className="relative h-32 sm:h-40">
          <Image src="/images/resto-hero.png" alt="Restaurant" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--restaurant-brown)]/80 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 text-white">
            <h1 className="resto-heading text-2xl sm:text-3xl font-bold">Good day, chef!</h1>
            <p className="text-white/80 mt-1 text-sm">
              {outlet ? <>Managing <strong>{outlet.name}</strong></> : <>Overview for <strong>{organization.name}</strong></>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            className={`resto-card border-0 ${s.color} opacity-0 animate-fade-in-up hover:scale-105 transition-transform`}
            style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "forwards" }}
          >
            <CardContent className="pt-4 pb-3">
              <RestoIcon name={s.icon} className="h-6 w-6 text-primary" />
              <p className="text-xs text-muted-foreground mt-2">{s.label}</p>
              <p className="text-2xl font-bold text-[var(--restaurant-brown)]">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {can("viewFinance") && data.monthlyIncome !== undefined && (
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Monthly Income", value: data.monthlyIncome!, color: "text-green-700", icon: "income" as const },
          { label: "Monthly Expense", value: data.monthlyExpense!, color: "text-primary", icon: "expense" as const },
          { label: "Net Profit", value: data.monthlyProfit!, color: "text-[var(--restaurant-brown)]", icon: "finance" as const },
        ].map((f, i) => (
          <Card key={f.label} className="resto-card opacity-0 animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.08}s`, animationFillMode: "forwards" }}>
            <CardContent className="pt-4">
              <RestoIcon name={f.icon} className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground mt-1">{f.label}</p>
              <p className={`text-2xl font-bold ${f.color}`}>
                {formatCurrency(f.value!, outlet?.currency ?? "USD")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {data.recentRuns.length > 0 && (
        <Card className="resto-card animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <CardHeader>
            <CardTitle className="resto-heading text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{run.sop.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {run.outlet?.name} · {run.assignedTo.name || run.assignedTo.email}
                  </p>
                </div>
                <Badge variant={run.status === "completed" ? "default" : "secondary"}>
                  {run.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
