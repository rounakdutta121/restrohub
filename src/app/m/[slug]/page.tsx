"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { RestoLoader } from "@/components/ui/resto-loader";
import { RestoIcon } from "@/components/brand/icons";
import { Button } from "@/components/ui/button";

interface MenuData {
  outlet: { name: string; city: string | null; currency: string };
  categories: {
    name: string;
    items: { name: string; description: string | null; price: number }[];
  }[];
}

export default function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<MenuData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "not_found" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/public/menu/${slug}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("not_found");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const json = (await res.json()) as MenuData;
        setData(json);
        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "loading") {
    return (
      <div className="min-h-screen menu-gradient flex items-center justify-center">
        <RestoLoader message="Plating your menu..." />
      </div>
    );
  }

  if (status === "not_found" || status === "error" || !data) {
    return (
      <div className="min-h-screen menu-gradient flex items-center justify-center px-4">
        <div className="resto-card p-8 max-w-md text-center space-y-3">
          <RestoIcon name="brand" className="h-10 w-10 text-primary mx-auto" />
          <h1 className="resto-heading text-xl font-bold text-[var(--restaurant-brown)]">
            {status === "not_found" ? "Menu not found" : "Couldn’t load this menu"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "not_found"
              ? "This QR link may be outdated, or the outlet isn’t published yet."
              : "Please try again in a moment."}
          </p>
          <Link href="/">
            <Button variant="outline" className="rounded-full mt-2">
              Visit RestoHub
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen menu-gradient animate-fade-in">
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <Image
          src="/images/resto-food-spread.png"
          alt="Our food"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-primary/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-primary-foreground text-center px-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm mb-2 animate-float">
            <RestoIcon name="brand" className="h-6 w-6" />
          </span>
          <h1 className="resto-heading text-3xl sm:text-4xl font-bold drop-shadow-lg">{data.outlet.name}</h1>
          {data.outlet.city && <p className="text-primary-foreground/80 mt-1 text-sm">{data.outlet.city}</p>}
          <p className="text-xs mt-2 opacity-70 uppercase tracking-[0.2em]">Our Menu</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        {data.categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 sticky top-0 z-10 bg-[color-mix(in_srgb,var(--restaurant-cream)_92%,transparent)] backdrop-blur-sm -mx-4 px-4 py-2">
            {data.categories.map((cat) => (
              <a
                key={cat.name}
                href={`#cat-${encodeURIComponent(cat.name)}`}
                className="shrink-0 rounded-full bg-white/80 border border-[var(--restaurant-mustard)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--restaurant-brown)]"
              >
                {cat.name}
              </a>
            ))}
          </div>
        )}

        {data.categories.length === 0 ? (
          <div className="resto-card p-8 text-center animate-fade-in-up">
            <Image
              src="/images/resto-kitchen.png"
              alt="Kitchen"
              width={200}
              height={150}
              className="rounded-2xl mx-auto object-cover h-36 w-full max-w-[200px] mb-4"
            />
            <p className="resto-heading text-lg font-semibold text-[var(--restaurant-brown)]">Menu coming soon!</p>
            <p className="text-sm text-muted-foreground mt-1">Our chefs are preparing something delicious.</p>
          </div>
        ) : (
          data.categories.map((cat, ci) => (
            <div
              key={cat.name}
              id={`cat-${encodeURIComponent(cat.name)}`}
              className="mb-8 scroll-mt-16 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${ci * 0.1}s`, animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-[var(--restaurant-mustard)]/50" />
                <h2 className="resto-heading text-xl font-bold text-[var(--restaurant-brown)] whitespace-nowrap px-2">
                  {cat.name}
                </h2>
                <div className="h-px flex-1 bg-[var(--restaurant-mustard)]/50" />
              </div>

              <div className="space-y-3">
                {cat.items.map((item) => (
                  <div
                    key={item.name}
                    className="resto-card p-4 flex justify-between gap-4 items-start hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--restaurant-brown)]">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-bold shadow-sm">
                      {formatCurrency(item.price, data.outlet.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="text-center mt-12 pt-6 border-t border-[var(--restaurant-mustard)]/30 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="resto-heading font-bold text-primary">RestoHub</span>
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 inline-flex items-center justify-center gap-1">
            Bon appétit!
            <RestoIcon name="flame" className="h-3 w-3 text-primary" />
          </p>
        </div>
      </div>
    </div>
  );
}
