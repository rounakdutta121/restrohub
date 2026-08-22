"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
import { OutletLiveProvider } from "@/hooks/use-outlet-live";
import { usePermissions } from "@/hooks/use-permissions";
import { NotificationBell } from "@/components/notification-bell";
import { LogoMark } from "@/components/brand/logo";
import { RoleBadge } from "@/components/brand/role-badge";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";
import { DevelopedBy } from "@/components/brand/developed-by";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: RestoIconName;
  needsOutlet?: boolean;
};

const operationsNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/outlets", label: "Outlets", icon: "outlets" },
  { href: "/dashboard/menus", label: "Menus", icon: "menus", needsOutlet: true },
  { href: "/dashboard/tables", label: "Tables", icon: "tables", needsOutlet: true },
  { href: "/dashboard/kitchen", label: "Kitchen", icon: "chef", needsOutlet: true },
  { href: "/dashboard/inventory", label: "Inventory", icon: "stock", needsOutlet: true },
];

const kitchenNav: NavItem[] = [
  { href: "/dashboard/checklists", label: "Checklists", icon: "prep" },
  { href: "/dashboard/runs", label: "Runs", icon: "runs" },
];

const manageNav: NavItem[] = [
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/dashboard/finance", label: "Finance", icon: "finance", needsOutlet: true },
  { href: "/dashboard/team", label: "Team", icon: "team" },
  { href: "/dashboard/notifications", label: "Alerts", icon: "bell" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  { href: "/dashboard/docs", label: "Docs", icon: "docs" },
];

const mobilePrimary: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/tables", label: "Tables", icon: "tables", needsOutlet: true },
  { href: "/dashboard/kitchen", label: "Kitchen", icon: "chef", needsOutlet: true },
  { href: "/dashboard/menus", label: "Menus", icon: "menus", needsOutlet: true },
];

const mobileMore: NavItem[] = [
  { href: "/dashboard/outlets", label: "Outlets", icon: "outlets" },
  { href: "/dashboard/checklists", label: "Checklists", icon: "prep" },
  { href: "/dashboard/runs", label: "Runs", icon: "runs" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "stock", needsOutlet: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/dashboard/finance", label: "Finance", icon: "finance", needsOutlet: true },
  { href: "/dashboard/team", label: "Team", icon: "team" },
  { href: "/dashboard/notifications", label: "Alerts", icon: "bell" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  { href: "/dashboard/docs", label: "Docs", icon: "docs" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({
  item,
  active,
  disabled,
}: {
  item: NavItem;
  active: boolean;
  disabled?: boolean;
}) {
  const className = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    disabled && "opacity-40 pointer-events-none cursor-not-allowed",
    active
      ? "bg-[var(--restaurant-mustard)] text-[var(--restaurant-brown)] shadow-sm"
      : "text-white/75 hover:bg-white/10 hover:text-white"
  );

  if (disabled) {
    return (
      <span className={className} title="Add an outlet first">
        <RestoIcon name={item.icon} className="h-4 w-4 shrink-0" />
        {item.label}
      </span>
    );
  }

  return (
    <Link href={item.href} className={className}>
      <RestoIcon name={item.icon} className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  hasOutlets,
  canAccessNav,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  hasOutlets: boolean;
  canAccessNav: (href: string) => boolean;
}) {
  const visible = items.filter((item) => canAccessNav(item.href));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
        {title}
      </p>
      {visible.map((item) => (
        <SidebarLink
          key={item.href}
          item={item}
          active={isActivePath(pathname, item.href)}
          disabled={item.needsOutlet && !hasOutlets}
        />
      ))}
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { organization, organizations, loading: orgsLoading, setOrganization } = useOrganization();
  const { outlet, outlets, setOutlet } = useOutlet();
  const { canAccessNav } = usePermissions();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (orgsLoading) return;
    if (organizations.length === 0 && pathname !== "/dashboard/setup" && pathname !== "/dashboard/docs") {
      router.replace("/dashboard/setup");
    }
  }, [orgsLoading, organizations.length, pathname, router]);

  const hasOutlets = outlets.length > 0;
  const visibleMobilePrimary = mobilePrimary.filter((item) => canAccessNav(item.href));
  const visibleMobileMore = mobileMore.filter((item) => canAccessNav(item.href));
  const moreActive = visibleMobileMore.some((item) => isActivePath(pathname, item.href));

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="min-h-screen flex bg-background pb-16 lg:pb-0">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[var(--restaurant-brown)] text-white sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="resto-heading font-bold text-xl">
              Resto<span className="text-[var(--restaurant-yellow)]">Hub</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          <NavGroup
            title="Operations"
            items={operationsNav}
            pathname={pathname}
            hasOutlets={hasOutlets}
            canAccessNav={canAccessNav}
          />
          <NavGroup
            title="Kitchen"
            items={kitchenNav}
            pathname={pathname}
            hasOutlets={hasOutlets}
            canAccessNav={canAccessNav}
          />
          <NavGroup
            title="Manage"
            items={manageNav}
            pathname={pathname}
            hasOutlets={hasOutlets}
            canAccessNav={canAccessNav}
          />
        </div>

        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          {organization && (
            <p className="text-xs text-white/50 truncate px-1">{organization.name}</p>
          )}
          <RoleBadge tone="dark" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 h-14 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile logo */}
              <Link href="/dashboard" className="flex items-center gap-2 shrink-0 lg:hidden">
                <LogoMark size="sm" />
                <span className="resto-heading font-bold text-lg hidden sm:block text-[var(--restaurant-brown)]">
                  Resto<span className="text-primary">Hub</span>
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
                  <SelectTrigger className="w-32 sm:w-48 h-9 text-xs bg-secondary/30 border-border">
                    <span className="truncate">{organization?.name ?? "Organization"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {hasOutlets && (
                <Select
                  value={outlet?.id ?? ""}
                  onValueChange={(val) => {
                    const o = outlets.find((x) => x.id === val);
                    if (o) setOutlet(o);
                  }}
                >
                  <SelectTrigger className="w-32 sm:w-48 h-9 text-xs bg-secondary/30 border-border">
                    <span className="truncate">{outlet?.name ?? "Outlet"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="lg:hidden">
                <RoleBadge tone="light" />
              </div>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-9 w-9 rounded-full cursor-pointer ring-2 ring-[var(--restaurant-mustard)]/60">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-secondary text-secondary-foreground font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 resto-pattern">
          <div className="w-full max-w-6xl mx-auto">{children}</div>
          <DevelopedBy className="mt-10 mb-2" />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-stretch justify-around px-1 py-1">
          {visibleMobilePrimary.map((item) => {
            const active = isActivePath(pathname, item.href);
            const disabled = item.needsOutlet && !hasOutlets;
            return (
              <Link
                key={item.href}
                href={disabled ? "#" : item.href}
                onClick={(e) => disabled && e.preventDefault()}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                  disabled && "opacity-40 pointer-events-none",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <RestoIcon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              moreOpen || moreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <RestoIcon name="settings" className="h-5 w-5" />
            More
          </button>
        </div>
        {moreOpen && (
          <div className="border-t border-border px-3 py-3 grid grid-cols-4 gap-2 bg-background">
            {visibleMobileMore.map((item) => {
              const disabled = item.needsOutlet && !hasOutlets;
              return (
                <Link
                  key={item.href}
                  href={disabled ? "#" : item.href}
                  onClick={(e) => {
                    if (disabled) e.preventDefault();
                    else setMoreOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl p-2 text-xs border border-border/50",
                    disabled && "opacity-40",
                    isActivePath(pathname, item.href) && "bg-secondary/40 border-secondary"
                  )}
                >
                  <RestoIcon name={item.icon} className="h-4 w-4 text-primary" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <OutletProvider>
        <OutletLiveProvider>
          <DashboardShell>{children}</DashboardShell>
        </OutletLiveProvider>
      </OutletProvider>
    </OrganizationProvider>
  );
}
