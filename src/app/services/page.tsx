import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/marketing/site-shell";
import { BreadcrumbJsonLd } from "@/components/marketing/json-ld";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";
import { SITE_CONTACT } from "@/lib/site-content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Restaurant Software Services — QR Menus, Stock, Tables & More",
  description:
    "Explore RestoHub restaurant services: multi-outlet management, QR digital food menus, kitchen inventory & stock alerts, table seating and orders, prep checklists, F&B finance ledger, and role-based restaurant staff management.",
  path: "/services",
  keywords: [
    "restaurant QR menu service",
    "kitchen inventory software",
    "restaurant table order system",
    "food service checklist app",
    "multi location restaurant tools",
  ],
  ogImage: "/images/resto-operations.png",
});

const services: {
  icon: RestoIconName;
  title: string;
  summary: string;
  details: string[];
  who: string;
}[] = [
  {
    icon: "outlets",
    title: "Multi-outlet management",
    summary:
      "One organization, many locations. Each outlet has its own address, currency, timezone, and operational data while sharing the same team and checklists.",
    details: [
      "Create outlets for each branch — Bengali Dhaba WB, your Mumbai flagship, a cloud kitchen, all under one roof.",
      "Switch outlets instantly from the dashboard header without logging out.",
      "Admins see every location; staff only see outlets they are assigned to.",
      "Delete or deactivate outlets when you consolidate — data stays scoped per location.",
    ],
    who: "Owners & Admins create outlets. All assigned staff work within their locations.",
  },
  {
    icon: "menus",
    title: "Digital menus & QR codes",
    summary:
      "Build categorized menus with descriptions and prices. Generate a QR code per outlet that opens a beautiful public menu page — no app download for guests.",
    details: [
      "Add categories (Starters, Mains, Beverages) and items with prices in your outlet currency.",
      "Mark items unavailable when you run out — guests see live status.",
      "Download QR PNG for table tents, standees, or delivery packaging.",
      "Public URL: /m/your-outlet-slug — mobile-first, on-brand design.",
    ],
    who: "Managers edit menus. Staff view menus when taking table orders.",
  },
  {
    icon: "stock",
    title: "Inventory & stock alerts",
    summary:
      "Track ingredients across your business and set per-outlet quantities with reorder levels. Get notified before you hit zero.",
    details: [
      "Define ingredients once (flour, oil, paneer) with units like kg or litres.",
      "Set current stock and minimum levels per outlet independently.",
      "Low-stock notifications appear in the bell icon and Notifications page.",
      "Prevents last-minute runs to the market during Friday night rush.",
    ],
    who: "Managers update stock. Staff can view levels for awareness.",
  },
  {
    icon: "prep",
    title: "Prep & maintenance checklists",
    summary:
      "Standardize opening, closing, prep, and equipment checks. Create step-by-step SOPs and assign runs to specific people with due dates.",
    details: [
      "Checklist types: Prep, Opening, Closing, Maintenance.",
      "Each checklist has ordered steps with titles and descriptions.",
      "Compliance rate visible on the Home dashboard.",
      "Overdue runs trigger notifications so nothing slips through.",
    ],
    who: "Managers create and edit checklists. All staff execute runs.",
  },
  {
    icon: "runs",
    title: "Checklist runs & accountability",
    summary:
      "Turn a checklist template into a live run — assign it, track progress step by step, and know exactly who completed what and when.",
    details: [
      "Start a run from any checklist, pick assignee and outlet.",
      "Tick steps off on phone or tablet during service.",
      "Status flows: pending → in progress → completed automatically.",
      "Managers can delete mistaken runs; history helps with audits.",
    ],
    who: "Staff complete runs daily. Managers oversee and delete if needed.",
  },
  {
    icon: "tables",
    title: "Table allocation & orders",
    summary:
      "Visual table board for your floor. Seat guests, take orders from your live menu, add items mid-meal, and free tables when done.",
    details: [
      "Define tables with labels (T1, Patio 4) and seat capacity.",
      "Seat guests with name and party size; optionally add menu items to the order.",
      "Occupied tables show order summary and total in outlet currency.",
      "Staff add or remove line items; managers configure the table layout.",
    ],
    who: "Managers set up tables. Staff seat guests and manage orders.",
  },
  {
    icon: "finance",
    title: "Finance & ledger",
    summary:
      "Simple income and expense tracking per outlet, per month — in INR, USD, or whatever currency the outlet uses.",
    details: [
      "Log sales, rent, utilities, salaries, ingredients, and misc entries.",
      "Monthly income, expense, and profit summary cards.",
      "Home dashboard shows org-wide or outlet-scoped finance for managers.",
      "Manual ledger today — built for operators who want clarity without accounting complexity.",
    ],
    who: "Managers and above. Hidden from floor staff for privacy.",
  },
  {
    icon: "team",
    title: "Team, roles & invite-only access",
    summary:
      "No random signups to your restaurant data. Invite by email, assign role and outlets, and control exactly who can change what.",
    details: [
      "Roles: Owner (org creator), Admin, Manager, Staff — each with defined permissions.",
      "Invite links expire in 7 days; revoke pending invites anytime.",
      "Owner cannot be invited — only the person who creates the org holds it.",
      "Plan limits on team size: Free 3, Pro 25, Business unlimited.",
    ],
    who: "Admins and Owners manage team. See Docs for full permission matrix.",
  },
  {
    icon: "bell",
    title: "Notifications hub",
    summary:
      "One inbox for operational alerts — low stock, overdue checklists, maintenance due — so managers react before guests notice.",
    details: [
      "Personal notifications per user account.",
      "Mark read, mark all read, or clear individually.",
      "Tied to outlet context where relevant.",
      "Reduces reliance on WhatsApp groups for operational chatter.",
    ],
    who: "All logged-in users receive relevant alerts.",
  },
  {
    icon: "settings",
    title: "Organizations & plans",
    summary:
      "Create multiple restaurant groups under one login. Upgrade plans as you add outlets and staff — demo billing built in.",
    details: [
      "Free: 1 outlet, 3 staff, 20 menu items.",
      "Pro: 5 outlets, 25 staff, unlimited menus and checklists.",
      "Business: unlimited scale with full platform access.",
      "Admins upgrade from Settings → Organizations → Upgrade plan.",
    ],
    who: "Owners delete orgs. Admins upgrade plans.",
  },
];

export default function ServicesPage() {
  return (
    <SiteShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Restaurant Services", path: "/services" },
        ]}
      />
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <Image src="/images/resto-operations.png" alt="Restaurant operations" fill className="object-cover" />
        <div className="absolute inset-0 bg-[var(--restaurant-brown)]/85" />
        <div className="container mx-auto px-4 relative z-10 text-white max-w-3xl">
          <h1 className="resto-heading text-4xl sm:text-5xl font-bold mb-6">Our services</h1>
          <p className="text-lg text-white/85 leading-relaxed">
            RestoHub is not a single feature — it is a complete operating system for restaurants.
            Below is every module we offer, who uses it, and why it matters for your business.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="resto-card p-8 border-0 bg-secondary/10 mb-16">
            <h2 className="resto-heading text-2xl font-bold mb-4 text-[var(--restaurant-brown)]">
              One platform instead of many headaches
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Most restaurants stitch together WhatsApp, Excel, printed menus, and memory.
              RestoHub replaces that patchwork with integrated modules that share the same
              outlets, team, and menu data — so when a manager marks butter chicken unavailable,
              your QR menu, table orders, and stock view all stay aligned.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You can adopt one module at a time — start with QR menus, add stock when ready —
              but the real power is when everything connects.
            </p>
          </div>

          <div className="space-y-12">
            {services.map((s, i) => (
              <article key={s.title} className="resto-card p-8 border-0 scroll-mt-24" id={s.title.toLowerCase().replace(/\s+/g, "-")}>
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <RestoIcon name={s.icon} className="h-6 w-6 text-primary" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service {i + 1}</span>
                    <h2 className="resto-heading text-2xl font-bold text-[var(--restaurant-brown)]">{s.title}</h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">{s.summary}</p>
                <ul className="space-y-2 mb-6">
                  {s.details.map((d) => (
                    <li key={d} className="flex gap-2 text-sm leading-relaxed">
                      <span className="text-primary shrink-0">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm bg-muted/50 rounded-lg px-4 py-3">
                  <strong className="text-foreground">Who uses it:</strong> {s.who}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/15">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="resto-heading text-3xl font-bold mb-4">Ready to see it live?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Create a free account and set up your first outlet in under ten minutes.
            Questions? Email {SITE_CONTACT.email} or call {SITE_CONTACT.phoneDisplay}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"><Button size="lg" className="rounded-full px-8">Start free</Button></Link>
            <Link href="/about"><Button size="lg" variant="outline" className="rounded-full px-8">About RestoHub</Button></Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
