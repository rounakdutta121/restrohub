"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { PUBLIC_NAV } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-full text-sm",
                    active && "bg-secondary/40 text-[var(--restaurant-brown)] font-semibold"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="flex gap-2 shrink-0">
          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full px-4 sm:px-6 shadow-md hover:scale-105 transition-transform">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
      <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2 border-t border-border/30">
        {PUBLIC_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full text-xs shrink-0",
                  active && "bg-secondary/40 font-semibold"
                )}
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
