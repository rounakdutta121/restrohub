import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, ROLE_SUMMARIES, type Role } from "@/lib/roles";

const ALL_ROLES: Role[] = ["owner", "admin", "manager", "staff"];

export function RoleGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border bg-secondary/10 p-4 space-y-0">
      {ALL_ROLES.map((role) => (
        <div
          key={role}
          className={`flex flex-col gap-1 py-2.5 border-b border-border/40 last:border-0 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="rounded-full capitalize">{ROLE_LABELS[role]}</Badge>
            {role === "owner" && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                Not invitable
              </span>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed">{ROLE_SUMMARIES[role]}</p>
        </div>
      ))}
    </div>
  );
}
