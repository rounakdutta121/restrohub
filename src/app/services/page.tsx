import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/marketing/site-shell";
import { BreadcrumbJsonLd } from "@/components/marketing/json-ld";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";
import { SITE_CONTACT } from "@/lib/site-content";
import { createPageMetadata, PAGE_KEYWORDS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Restaurant Software Features — QR Menus, Stock, Tables & Analytics",
  description:
    "Explore RestoHub features: multi-outlet restaurant management, QR digital food menus, kitchen inventory & low-stock alerts, table seating & paid orders, prep checklists, F&B finance, owner analytics, and role-based staff tools — free for food outlets.",
  path: "/services",
  keywords: [...PAGE_KEYWORDS.services],
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
      "Switch outlets instantly from the dashboard without logging out.",
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
      "Manual ledger today — clarity without accounting complexity.",
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
      "Unlimited team size during this free release.",
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
    title: "Organizations",
    summary:
      "Create multiple restaurant groups under one login. Add as many outlets and teammates as you need — fully free for this release.",
    details: [
      "Unlimited outlets, staff, menu items, and checklists.",
      "Invite-only team access with role-based permissions.",
      "Switch organizations from the dashboard anytime.",
      "No payment, packs, or upgrade screens.",
    ],
    who: "Owners delete orgs. Admins manage outlets and team.",
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

      {/* 1 — DARK: Hero */}
      <section className="relative landing-section landing-dark !py-24 sm:!py-32">
        <Image
          src="/images/resto-operations.png"
          alt="Restaurant operations software"
          fill
          className="object-cover opacity-55"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--restaurant-brown)]/80 via-[var(--restaurant-brown)]/55 to-[var(--restaurant-brown)]/25" />
        <div className="landing-container max-w-3xl">
          <p className="landing-eyebrow mb-5 bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)]">
            Services
          </p>
          <h1 className="resto-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Our services
          </h1>
          <p className="text-lg sm:text-xl text-white/80 leading-relaxed">
            RestoHub is not a single feature — it is a complete operating system for restaurants.
            Every module, who uses it, and why it matters.
          </p>
        </div>
      </section>

      {/* 2 — LIGHT: Overview */}
      <section className="landing-section landing-light">
        <div className="landing-container max-w-3xl">
          <p className="landing-eyebrow mb-4 bg-primary/10 text-primary">Overview</p>
          <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-5 leading-tight">
            One platform instead of many headaches
          </h2>
          <p className="text-[var(--restaurant-brown)]/70 leading-relaxed mb-4 text-base sm:text-lg">
            Most restaurants stitch together WhatsApp, Excel, printed menus, and memory. RestoHub
            replaces that patchwork with integrated modules that share the same outlets, team, and
            menu data — so when a manager marks butter chicken unavailable, your QR menu, table
            orders, and stock view all stay aligned.
          </p>
          <p className="text-[var(--restaurant-brown)]/70 leading-relaxed text-base sm:text-lg">
            You can adopt one module at a time — start with QR menus, add stock when ready — but
            the real power is when everything connects.
          </p>
        </div>
      </section>

      {/* 3 — DARK: Service modules */}
      <section className="landing-section landing-dark">
        <div className="landing-container">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <p className="landing-eyebrow mb-4 bg-white/10 text-[var(--restaurant-yellow)]">Modules</p>
            <h2 className="resto-heading text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
              Everything you get
            </h2>
            <p className="text-white/60 text-base sm:text-lg">
              Ten connected services — free during this release.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5">
            {services.map((s, i) => (
              <article
                key={s.title}
                id={s.title.toLowerCase().replace(/\s+/g, "-")}
                className="landing-feature-dark scroll-mt-24"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--restaurant-yellow)]/15 shrink-0">
                    <RestoIcon name={s.icon} className="h-6 w-6 text-[var(--restaurant-yellow)]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                      Service {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="resto-heading text-xl sm:text-2xl font-bold text-white mt-1 mb-2">
                      {s.title}
                    </h3>
                    <p className="text-white/65 text-sm sm:text-base leading-relaxed mb-4">
                      {s.summary}
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-2 mb-4">
                      {s.details.map((d) => (
                        <li key={d} className="flex gap-2 text-sm text-white/55 leading-relaxed">
                          <span className="text-[var(--restaurant-yellow)] shrink-0">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs sm:text-sm rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-white/70">
                      <strong className="text-[var(--restaurant-yellow)]">Who uses it:</strong>{" "}
                      {s.who}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — LIGHT: CTA */}
      <section className="landing-section landing-light">
        <div className="landing-container max-w-3xl text-center">
          <p className="landing-eyebrow mb-4 bg-primary/10 text-primary">Get started</p>
          <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            Ready to see it live?
          </h2>
          <p className="text-[var(--restaurant-brown)]/70 mb-8 leading-relaxed text-base sm:text-lg">
            Create a free account and set up your first outlet in under ten minutes. Questions?
            Email {SITE_CONTACT.email} or call {SITE_CONTACT.phoneDisplay}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="rounded-full px-8 w-full sm:w-auto">
                Start free
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="rounded-full px-8 w-full sm:w-auto">
                About RestoHub
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
