"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  outlet?: { name: string } | null;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unread = notifications.filter((n) => !n.read).length;

  async function load() {
    const d = await fetchJson<Notification[]>("/api/notifications");
    if (Array.isArray(d)) setNotifications(d);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

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
      <DropdownMenuTrigger className="relative p-2 rounded-full hover:bg-white/10 cursor-pointer text-white/90">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)] border-0">
            {unread}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-muted-foreground hover:underline">
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">No notifications</div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-0.5 ${!n.read ? "bg-muted/50" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <span className="text-xs font-medium">{n.type.replace("_", " ")}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuItem>
          <Link href="/dashboard/notifications" className="w-full text-center text-sm">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
