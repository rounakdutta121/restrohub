import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/marketing/site-shell";
import { HomeFaqJsonLd } from "@/components/marketing/json-ld";
import { RestoIcon, RestoIconBadge, type RestoIconName } from "@/components/brand/icons";
import { SITE_CONTACT } from "@/lib/site-content";
import { createPageMetadata, PAGE_KEYWORDS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Free Restaurant Management Software & QR Digital Menus",
  description:
    "RestoHub is free restaurant management software for restaurants, cafes, dhabas & cloud kitchens — live kitchen board, multi-device floor sync, QR menus, inventory alerts, table orders, checklists, finance & analytics. Start free, no card needed.",
  path: "/",
  keywords: [...PAGE_KEYWORDS.home],
  ogImage: "/images/resto-hero.png",
});

const features: { icon: RestoIconName; title: string; desc: string }[] = [
  {
    icon: "outlets",
    title: "Every outlet, one hub",
    desc: "Mumbai, Kolkata, Dubai — manage every location from one dashboard with instant outlet switching.",
  },
  {
    icon: "mobile",
    title: "QR menus guests love",
    desc: "Beautiful mobile menus per outlet. Guests scan and see live prices in INR, USD, and more.",
  },
  {
    icon: "chef",
    title: "Live kitchen board",
    desc: "Pending, preparing, ready — tickets land on a kitchen tablet the moment floor staff send items.",
  },
  {
    icon: "tables",
    title: "Tables that stay in sync",
    desc: "Seat, search the menu, add items, settle or walk out — the floor board updates across devices in seconds.",
  },
  {
    icon: "bell",
    title: "Role-based alerts",
    desc: "Kitchen orders to staff, stock & paid checks to managers — the right people get the right ping.",
  },
  {
    icon: "finance",
    title: "Finance that follows the floor",
    desc: "Paid tables count as income automatically. Track expenses and profit per outlet currency.",
  },
];

const advantages = [
  "Replace spreadsheets, WhatsApp groups, and paper checklists with one system.",
  "Floor and kitchen stay live — no reload, no shouting across the pass.",
  "Staff take table orders from the menu you already maintain — search included.",
  "Managers see finance and stock; staff focus on service — permissions built in.",
  "QR menus update instantly when you change prices — no reprinting.",
  "Built for Indian restaurants and global chains — INR formatting, local support.",
];

export default function HomePage() {
  return (
    <SiteShell>
      <HomeFaqJsonLd />

      {/* 1 — DARK: Hero */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden landing-dark">
        <Image
          src="/images/resto-hero.png"
          alt="RestoHub restaurant management software for multi-outlet food businesses"
          fill
          className="object-cover opacity-70"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--restaurant-brown)]/90 via-[var(--restaurant-brown)]/45 to-[var(--restaurant-brown)]/20 sm:bg-gradient-to-r sm:from-[var(--restaurant-brown)]/80 sm:via-[var(--restaurant-brown)]/45 sm:to-[var(--restaurant-brown)]/10" />
        <div className="landing-container relative z-10 py-24 pt-28 sm:py-28 lg:py-32">
          <div className="max-w-2xl lg:max-w-3xl animate-fade-in-up">
            <p className="landing-eyebrow mb-5 sm:mb-6 bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)]">
              <RestoIcon name="brand" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Free restaurant operations platform
            </p>
            <h1 className="resto-heading text-[2.35rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-5 sm:mb-6">
              Run every outlet.
              <br />
              <span className="text-[var(--restaurant-yellow)]">Delight every guest.</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-8 sm:mb-10 max-w-xl leading-relaxed">
              Live kitchen board, synced table floor, QR menus, stock alerts, finance, and your
              whole team — in one warm hub built for real kitchens.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-8 h-12 text-base bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)] hover:bg-[var(--restaurant-yellow)]/90 shadow-xl hover:scale-[1.02] transition-transform font-semibold"
                >
                  Start free — no card needed
                </Button>
              </Link>
              <Link href="/services" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 h-12 text-base border-white/35 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  Explore services
                </Button>
              </Link>
            </div>
            <div className="mt-10 sm:mt-14 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-white/55">
              <span>Live kitchen board</span>
              <span className="hidden sm:inline text-white/25">·</span>
              <span>Multi-device sync</span>
              <span className="hidden sm:inline text-white/25">·</span>
              <span>QR menus · INR-ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — LIGHT: Why */}
      <section className="landing-section landing-light">
        <div className="landing-container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <p className="landing-eyebrow mb-4 bg-primary/10 text-primary">Why RestoHub</p>
              <h2 className="resto-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold mb-5 leading-tight">
                Built for the Friday night rush
              </h2>
              <p className="text-[var(--restaurant-brown)]/70 leading-relaxed mb-7 text-base sm:text-lg">
                You should not need five apps for menus, stock, staff tasks, and money. RestoHub
                brings clarity to owners, managers, and floor staff — so you spend less time chasing
                updates and more time on food and guests.
              </p>
              <ul className="space-y-3.5">
                {advantages.map((a) => (
                  <li key={a} className="flex gap-3 text-sm sm:text-[0.95rem] leading-relaxed">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                      ✓
                    </span>
                    <span className="text-[var(--restaurant-brown)]/80">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-[var(--restaurant-brown)]/10">
                <Image
                  src="/images/resto-trust.png"
                  alt="Restaurant team using food service operations software"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -bottom-4 -left-2 sm:left-4 sm:bottom-6 rounded-2xl bg-white px-4 py-3 shadow-xl border border-[var(--restaurant-brown)]/8 max-w-[220px]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Live ops
                </p>
                <p className="resto-heading text-sm font-bold text-[var(--restaurant-brown)] mt-0.5">
                  Kitchen · Floor · Alerts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — DARK: Features */}
      <section id="features" className="landing-section landing-dark">
        <div className="landing-container">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="landing-eyebrow mb-4 bg-white/10 text-[var(--restaurant-yellow)]">
              Platform
            </p>
            <h2 className="resto-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white mb-4 leading-tight">
              Everything in one place
            </h2>
            <p className="text-white/65 text-base sm:text-lg leading-relaxed">
              From walk-in to walk-out — tools shaped around how restaurants actually work.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="landing-feature-dark opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s`, animationFillMode: "forwards" }}
              >
                <RestoIconBadge
                  name={f.icon}
                  size="md"
                  className="mb-4 bg-[var(--restaurant-yellow)]/15 text-[var(--restaurant-yellow)]"
                />
                <h3 className="resto-heading font-bold text-lg text-white mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 sm:px-8">
            <p className="text-white/75 text-sm sm:text-base">
              Kitchen board, live sync, role alerts, and unlimited growth — all free.
            </p>
            <Link href="/services">
              <Button
                variant="outline"
                className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white w-full sm:w-auto"
              >
                Full service breakdown →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 — LIGHT: QR menus */}
      <section className="landing-section landing-light">
        <div className="landing-container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[16/11] sm:aspect-[5/3] rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-[var(--restaurant-brown)]/10">
              <Image
                src="/images/resto-food-spread.png"
                alt="Digital QR food menu for restaurant guests"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--restaurant-brown)]/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xs rounded-xl bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Guest experience
                </p>
                <p className="resto-heading font-bold text-[var(--restaurant-brown)] text-sm mt-0.5">
                  Scan · Browse · Order-ready prices
                </p>
              </div>
            </div>
            <div>
              <p className="landing-eyebrow mb-4 bg-primary/10 text-primary">QR digital menus</p>
              <h2 className="resto-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold mb-5 leading-tight">
                Menus guests will actually use
              </h2>
              <p className="text-[var(--restaurant-brown)]/70 leading-relaxed mb-6 text-base sm:text-lg">
                Each outlet gets a public menu page and downloadable QR. Change a price once —
                every table tent and guest phone updates instantly, in your local currency.
              </p>
              <ul className="space-y-3 mb-8 text-sm sm:text-base text-[var(--restaurant-brown)]/80">
                <li className="flex gap-2.5">
                  <span className="text-primary font-bold">→</span>
                  Mobile-first design for phones at the table
                </li>
                <li className="flex gap-2.5">
                  <span className="text-primary font-bold">→</span>
                  Mark items unavailable when you run out
                </li>
                <li className="flex gap-2.5">
                  <span className="text-primary font-bold">→</span>
                  Download PNG for standees and packaging
                </li>
              </ul>
              <Link href="/signup">
                <Button className="rounded-full px-8 h-11 w-full sm:w-auto">
                  Create your first QR menu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — DARK: Free + contact */}
      <section className="landing-section landing-dark">
        <div className="landing-container">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-14 items-center">
            <div>
              <p className="landing-eyebrow mb-4 bg-[var(--restaurant-yellow)]/15 text-[var(--restaurant-yellow)]">
                Free release
              </p>
              <h2 className="resto-heading text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white mb-4 leading-tight">
                Free for everyone.
                <br className="hidden sm:block" />
                No packs. No upgrades.
              </h2>
              <p className="text-white/65 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
                Unlimited outlets, staff, menus, and checklists. Create your account in minutes
                and invite the crew when you&apos;re ready.
              </p>
              <Link href="/signup" className="inline-block w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-10 h-12 text-base bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)] hover:bg-[var(--restaurant-yellow)]/90 font-semibold shadow-xl"
                >
                  Create free account
                </Button>
              </Link>
            </div>

            <div className="grid gap-3">
              <a
                href={`mailto:${SITE_CONTACT.email}`}
                className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-4 hover:bg-white/[0.1] transition-colors"
              >
                <span className="text-xs text-white/50 block mb-1">Email</span>
                <span className="font-semibold text-[var(--restaurant-yellow)] break-all text-sm sm:text-base">
                  {SITE_CONTACT.email}
                </span>
              </a>
              <a
                href={`tel:${SITE_CONTACT.phone}`}
                className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-4 hover:bg-white/[0.1] transition-colors"
              >
                <span className="text-xs text-white/50 block mb-1">Phone</span>
                <span className="font-semibold text-[var(--restaurant-yellow)] text-sm sm:text-base">
                  {SITE_CONTACT.phoneDisplay}
                </span>
              </a>
              <p className="text-xs text-white/45 px-1 pt-1">
                Questions? Talk to a real person — we build for operators, not pitch decks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — LIGHT: Final CTA strip */}
      <section className="landing-section landing-light !py-14 sm:!py-16">
        <div className="landing-container">
          <div className="relative rounded-[1.75rem] overflow-hidden">
            <div className="absolute inset-0">
              <Image
                src="/images/resto-operations.png"
                alt=""
                fill
                className="object-cover"
                aria-hidden="true"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-[var(--restaurant-brown)]/80" />
            </div>
            <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 text-center text-white">
              <h2 className="resto-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                Your kitchen deserves better tools
              </h2>
              <p className="text-white/75 mb-7 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
                Floor and kitchen on the same pulse — so guests get a smoother experience.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="rounded-full px-10 h-12 bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)] hover:bg-[var(--restaurant-yellow)]/90 font-semibold shadow-xl"
                >
                  Get started in minutes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
