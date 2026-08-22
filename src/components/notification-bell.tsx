"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { useOutlet } from "@/hooks/use-outlet";
import { useLivePulse, useOutletLive } from "@/hooks/use-outlet-live";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  outlet?: { name: string } | null;
}

const typeIcons: Record<string, RestoIconName> = {
  low_stock: "stock",
  new_order: "chef",
  order_settled: "finance",
  checklist_due: "clock",
  overdue_checklist: "clock",
  maintenance_due: "maintenance",
  maintenance: "maintenance",
};

const typeHref: Record<string, string> = {
  low_stock: "/dashboard/inventory",
  new_order: "/dashboard/kitchen",
  order_settled: "/dashboard/finance",
  checklist_due: "/dashboard/runs",
  overdue_checklist: "/dashboard/runs",
  maintenance_due: "/dashboard/runs",
  maintenance: "/dashboard/runs",
};

export function NotificationBell() {
  const router = useRouter();
  const { outlet } = useOutlet();
  const { unread: liveUnread } = useLivePulse();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    const d = await fetchJson<Notification[]>("/api/notifications");
    if (Array.isArray(d)) setNotifications(d);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOutletLive(outlet?.id, () => {
    load();
  });

  const listUnread = notifications.filter((n) => !n.read).length;
  const unread = Math.max(listUnread, liveUnread || 0);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2 rounded-full hover:bg-muted cursor-pointer text-foreground/80">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground border-0">
            {unread > 9 ? "9+" : unread}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-medium">Alerts</span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No alerts right now
          </div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-0.5 cursor-pointer"
              onClick={() => {
                if (!n.read) void markRead(n.id);
                router.push(typeHref[n.type] || "/dashboard/notifications");
              }}
            >
              <span className="flex items-center gap-1.5 w-full">
                <RestoIcon
                  name={typeIcons[n.type] || "bell"}
                  className="h-3.5 w-3.5 text-primary shrink-0"
                />
                <span
                  className={`text-sm line-clamp-2 ${
                    n.read ? "text-muted-foreground" : "font-medium"
                  }`}
                >
                  {n.message}
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground pl-5">
                {n.outlet?.name ? `${n.outlet.name} · ` : ""}
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <div className="px-2 py-1.5">
          <Link
            href="/dashboard/notifications"
            className="block text-center text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
