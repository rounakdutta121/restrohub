"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@/hooks/use-organization";
import { useOutlet } from "@/hooks/use-outlet";
import { RestoLoader } from "@/components/ui/resto-loader";
import { RestoIcon } from "@/components/brand/icons";
import { toast } from "sonner";
import { toastApiError } from "@/lib/toast-errors";

type Step = 1 | 2 | 3 | 4;

export default function SetupPage() {
  const router = useRouter();
  const { organization, organizations, loading: orgsLoading, setOrganization, refresh: refreshOrg } = useOrganization();
  const { setOutlet, refresh: refreshOutlets } = useOutlet();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [outletForm, setOutletForm] = useState({
    name: "",
    city: "",
    currency: "INR",
  });
  const [categoryName, setCategoryName] = useState("Starters");
  const [createdOutletId, setCreatedOutletId] = useState<string | null>(null);

  useEffect(() => {
    if (orgsLoading) return;
    if (organizations.length > 0 && organization) {
      const outletCount = organization._count?.outlets ?? 0;
      // Only auto-skip when landing fresh — don't interrupt an in-progress wizard
      if (step === 1 && outletCount === 0) {
        setStep(2);
      } else if (step === 1 && outletCount > 0) {
        router.replace("/dashboard");
      }
    }
  }, [orgsLoading, organizations, organization, router, step]);

  async function createOrg() {
    if (!orgName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toastApiError(data.error, "Could not create organization");
      return;
    }
    await refreshOrg();
    setOrganization({ ...data, role: "owner", outletIds: [], _count: { members: 1, outlets: 0, sops: 0 } });
    toast.success("Organization created");
    setStep(2);
  }

  async function createOutlet() {
    if (!organization || !outletForm.name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/workspaces/${organization.id}/outlets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: outletForm.name.trim(),
        city: outletForm.city.trim() || undefined,
        currency: outletForm.currency || "INR",
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toastApiError(data.error, "Could not create outlet");
      return;
    }
    setCreatedOutletId(data.id);
    await refreshOrg();
    await refreshOutlets();
    setOutlet(data);
    toast.success("Outlet created");
    setStep(3);
  }

  async function addCategory() {
    if (!createdOutletId || !categoryName.trim()) {
      setStep(4);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/outlets/${createdOutletId}/menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", categoryName: categoryName.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastApiError(data.error, "Could not add category");
      return;
    }
    toast.success("Menu category added");
    setStep(4);
  }

  if (orgsLoading) {
    return <RestoLoader message="Preparing your kitchen..." />;
  }

  const steps = [
    { n: 1, label: "Organization" },
    { n: 2, label: "Outlet" },
    { n: 3, label: "Menu" },
    { n: 4, label: "Done" },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-4">
      <div className="text-center space-y-2">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <RestoIcon name="brand" className="h-6 w-6" />
        </span>
        <h1 className="resto-heading text-2xl font-bold text-[var(--restaurant-brown)]">
          Set up RestoHub
        </h1>
        <p className="text-sm text-muted-foreground">
          Three quick steps — then you&apos;re ready to run service.
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {steps.map((s) => (
          <div
            key={s.n}
            className={`h-1.5 w-12 rounded-full transition-colors ${
              step >= s.n ? "bg-primary" : "bg-border"
            }`}
            title={s.label}
          />
        ))}
      </div>

      <div className="resto-card p-6 space-y-4">
        {step === 1 && (
          <>
            <h2 className="resto-heading font-bold text-lg">Name your restaurant group</h2>
            <p className="text-sm text-muted-foreground">
              This is your organization — it can hold one outlet or many.
            </p>
            <div>
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                className="mt-1"
                placeholder="e.g. Spice Route Hospitality"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createOrg()}
              />
            </div>
            <Button className="w-full rounded-full" disabled={loading || !orgName.trim()} onClick={createOrg}>
              {loading ? "Creating..." : "Continue"}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="resto-heading font-bold text-lg">Add your first outlet</h2>
            <p className="text-sm text-muted-foreground">
              A location with its own menu, stock, tables, and currency.
            </p>
            <div>
              <Label htmlFor="outletName">Outlet name</Label>
              <Input
                id="outletName"
                className="mt-1"
                placeholder="e.g. Flagship — Koramangala"
                value={outletForm.name}
                onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  className="mt-1"
                  placeholder="Bengaluru"
                  value={outletForm.city}
                  onChange={(e) => setOutletForm({ ...outletForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  className="mt-1"
                  placeholder="INR"
                  value={outletForm.currency}
                  onChange={(e) => setOutletForm({ ...outletForm, currency: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <Button
              className="w-full rounded-full"
              disabled={loading || !outletForm.name.trim()}
              onClick={createOutlet}
            >
              {loading ? "Creating..." : "Continue"}
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="resto-heading font-bold text-lg">Start your menu (optional)</h2>
            <p className="text-sm text-muted-foreground">
              Add a first category now, or skip and build the full menu later.
            </p>
            <div>
              <Label htmlFor="cat">Category name</Label>
              <Input
                id="cat"
                className="mt-1"
                placeholder="Starters"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1 rounded-full" disabled={loading} onClick={addCategory}>
                {loading ? "Saving..." : "Add category"}
              </Button>
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(4)}>
                Skip for now
              </Button>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 py-2">
            <div className="text-4xl">🎉</div>
            <h2 className="resto-heading font-bold text-xl">You&apos;re ready</h2>
            <p className="text-sm text-muted-foreground">
              Add menu items, invite your team, or seat your first table — whenever you like.
            </p>
            <div className="grid gap-2">
              <Button className="rounded-full" onClick={() => router.push("/dashboard/menus")}>
                Build your menu
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => router.push("/dashboard")}>
                Go to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
