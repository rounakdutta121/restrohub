"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { OrganizationProvider, useOrganization } from "@/hooks/use-organization";
import { OutletProvider, useOutlet } from "@/hooks/use-outlet";
import { usePermissions } from "@/hooks/use-permissions";
import { NotificationBell } from "@/components/notification-bell";
import { LogoMark } from "@/components/brand/logo";
import { RoleBadge } from "@/components/brand/role-badge";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";

const navItems: { href: string; label: string; icon: RestoIconName }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/outlets", label: "Outlets", icon: "outlets" },
  { href: "/dashboard/menus", label: "Menus", icon: "menus" },
  { href: "/dashboard/inventory", label: "Stock", icon: "stock" },
  { href: "/dashboard/checklists", label: "Prep", icon: "prep" },
  { href: "/dashboard/runs", label: "Runs", icon: "runs" },
  { href: "/dashboard/tables", label: "Tables", icon: "tables" },
  { href: "/dashboard/finance", label: "Finance", icon: "finance" },
  { href: "/dashboard/team", label: "Team", icon: "team" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  { href: "/dashboard/docs", label: "Docs", icon: "docs" },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { organization, organizations, setOrganization } = useOrganization();
  const { outlet, outlets, setOutlet } = useOutlet();
  const { canAccessNav } = usePermissions();

  const visibleNav = navItems.filter((item) => canAccessNav(item.href));

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-[var(--restaurant-brown)] text-white shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <LogoMark size="sm" />
              <span className="resto-heading font-bold text-lg hidden sm:block">
                Resto<span className="text-[var(--restaurant-yellow)]">Hub</span>
              </span>
            </Link>

            {organizations.length > 0 && (
              <Select
                value={organization?.id ?? ""}
                onValueChange={(val) => {
                  const org = organizations.find((o) => o.id === val);
                  if (org) setOrganization(org);
                }}
              >
                <SelectTrigger className="w-36 sm:w-44 h-8 text-xs bg-white/10 border-white/20 text-white">
                  <span className="truncate">{organization?.name ?? "Organization"}</span>
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {outlets.length > 0 && (
              <Select
                value={outlet?.id ?? ""}
                onValueChange={(val) => {
                  const o = outlets.find((x) => x.id === val);
                  if (o) setOutlet(o);
                }}
              >
                <SelectTrigger className="w-36 sm:w-44 h-8 text-xs bg-white/10 border-white/20 text-white">
                  <span className="truncate">{outlet?.name ?? "Outlet"}</span>
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <RoleBadge />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full cursor-pointer ring-2 ring-[var(--restaurant-mustard)]">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-secondary text-secondary-foreground font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Nav strip */}
        <div className="border-t border-white/10 bg-[var(--restaurant-brown)]/95">
          <div className="w-full px-4 sm:px-6 lg:px-8 overflow-x-auto">
            <nav className="flex items-center gap-0.5 py-1.5 min-w-max">
              {visibleNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs rounded-full gap-1.5 ${
                        active
                          ? "bg-[var(--restaurant-mustard)] text-[var(--restaurant-brown)] font-semibold hover:bg-[var(--restaurant-mustard)]"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <RestoIcon name={item.icon} className="h-3.5 w-3.5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 resto-pattern min-h-[calc(100vh-7rem)]">
        <div className="w-full max-w-none">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <OutletProvider>
        <DashboardShell>{children}</DashboardShell>
      </OutletProvider>
    </OrganizationProvider>
  );
}
