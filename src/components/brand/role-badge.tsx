"use client";

import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

export function RoleBadge({ tone = "light" }: { tone?: "dark" | "light" }) {
  const { roleLabel, hasOrg } = usePermissions();
  if (!hasOrg) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex text-[10px] uppercase tracking-wide",
        tone === "dark"
          ? "border-white/30 text-white/90 bg-white/10"
          : "border-border text-muted-foreground bg-secondary/40"
      )}
    >
      {roleLabel}
    </Badge>
  );
}

export function ReadOnlyNotice({ message }: { message?: string }) {
  const { roleLabel } = usePermissions();
  return (
    <div className="rounded-lg border border-dashed border-[var(--restaurant-mustard)]/60 bg-[var(--restaurant-mustard)]/10 px-4 py-3 text-sm text-muted-foreground">
      <span className="font-semibold text-[var(--restaurant-brown)]">{roleLabel} — view only.</span>{" "}
      {message ?? "You can view this section but cannot make changes."}
    </div>
  );
}

export function AccessDenied({ title, description }: { title: string; description: string }) {
  const { roleLabel } = usePermissions();
  return (
    <div className="resto-card p-8 text-center max-w-lg mx-auto mt-10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{roleLabel}</p>
      <h2 className="resto-heading text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
    </div>
  );
}
