import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/marketing/site-shell";
import { BreadcrumbJsonLd } from "@/components/marketing/json-ld";
import { RestoIcon } from "@/components/brand/icons";
import { SITE_CONTACT } from "@/lib/site-content";
import { createPageMetadata, PAGE_KEYWORDS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About RestoHub — Free Restaurant Operations Software",
  description:
    "Learn about RestoHub: free restaurant operations software built for real kitchens — owners, cafe operators, and cloud kitchen teams who need QR menus, stock control, table orders, analytics, and staff tools without enterprise complexity.",
  path: "/about",
  keywords: [...PAGE_KEYWORDS.about],
  ogImage: "/images/resto-trust.png",
});

const values = [
  {
    title: "Built for real kitchens",
    body: "We design around Friday night rushes, monsoon ingredient shortages, and the owner who is also the cashier. RestoHub handles messy real-world operations — not demo-perfect scenarios.",
  },
  {
    title: "Clarity over complexity",
    body: "You should not need a consultant to use your ops software. Every screen is labeled in plain language — Stock, Prep, Tables — the same words your team already uses.",
  },
  {
    title: "Trust through transparency",
    body: "Role-based permissions mean staff see what they need and nothing sensitive. Your finance data stays with managers. Your guest menu is public by design — nothing else is.",
  },
  {
    title: "Local first, global ready",
    body: "INR formatting, Indian phone support, and multi-outlet groups whether you run a dhaba in West Bengal or a chain across three countries.",
  },
];

const timeline = [
  {
    year: "The problem",
    text: "Restaurant owners told us the same story: menus in PDFs, stock in notebooks, tasks in WhatsApp, money in Excel. Nothing talked to anything else.",
  },
  {
    year: "The insight",
    text: "Hospitality software often feels cold and corporate. Restaurants are warm, human, urgent — tools should match that energy.",
  },
  {
    year: "RestoHub",
    text: "We built one hub — outlets, QR menus, inventory, tables with orders, checklists, finance, team roles — so operators finally have a single place to run the house.",
  },
  {
    year: "Today",
    text: "RestoHub grows with every outlet you add. Start free, invite your crew, and run every location from one hub — no paid packs for this release.",
  },
];

const trustItems = [
  "Invite-only access — strangers cannot browse your dashboard.",
  "Role-based security — staff cannot see finance or delete menus.",
  "Outlet-scoped data — Kolkata stock does not mix with Mumbai stock.",
  "Owner protection — organization creator cannot be removed by mistake.",
  "Clear privacy policy — we tell you exactly what we store.",
  "Direct support — email and phone to real people, not ticket black holes.",
  "Free release — unlimited outlets, staff, menus, and checklists.",
  "No lock-in marketing — your Docs and workflows stay yours.",
];

export default function AboutPage() {
  return (
    <SiteShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />

      {/* 1 — DARK: Hero */}
      <section className="relative landing-section landing-dark !py-24 sm:!py-32">
        <Image
          src="/images/resto-trust.png"
          alt="About RestoHub"
          fill
          className="object-cover opacity-55"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--restaurant-brown)]/85 via-[var(--restaurant-brown)]/50 to-[var(--restaurant-brown)]/25" />
        <div className="landing-container max-w-3xl pt-4">
          <p className="landing-eyebrow mb-5 bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)]">
            About
          </p>
          <h1 className="resto-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            About RestoHub
          </h1>
          <p className="text-lg sm:text-xl text-white/80 leading-relaxed">
            We exist because running a restaurant should feel like hospitality — not homework.
            One trusted place for owners, managers, and staff to work together.
          </p>
        </div>
      </section>

      {/* 2 — LIGHT: Mission */}
      <section className="landing-section landing-light">
        <div className="landing-container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="landing-eyebrow mb-4 bg-primary/10 text-primary">Mission</p>
              <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-5 leading-tight">
                Our mission
              </h2>
              <p className="text-[var(--restaurant-brown)]/70 leading-relaxed mb-4 text-base sm:text-lg">
                Give every restaurant — from a single-family dhaba to a multi-city brand — the
                operational backbone that big chains take for granted, without the enterprise
                price tag or six-month implementation.
              </p>
              <p className="text-[var(--restaurant-brown)]/70 leading-relaxed mb-4 text-base sm:text-lg">
                When back-of-house runs smoothly, front-of-house smiles more. When managers see
                low stock before service, guests never hear &ldquo;sorry, that&apos;s finished.&rdquo;
              </p>
              <p className="text-[var(--restaurant-brown)]/70 leading-relaxed text-base sm:text-lg">
                That is why we integrated menus, stock, tables, tasks, money, and people into one
                product instead of selling you ten integrations.
              </p>
            </div>
            <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-[var(--restaurant-brown)]/10">
              <Image
                src="/images/resto-kitchen.png"
                alt="Kitchen team"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3 — DARK: Values */}
      <section className="landing-section landing-dark">
        <div className="landing-container">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <p className="landing-eyebrow mb-4 bg-white/10 text-[var(--restaurant-yellow)]">Values</p>
            <h2 className="resto-heading text-3xl sm:text-4xl font-bold text-white leading-tight">
              What we stand for
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {values.map((v) => (
              <div key={v.title} className="landing-feature-dark">
                <h3 className="resto-heading font-bold text-lg text-white mb-3">{v.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — LIGHT: Story */}
      <section className="landing-section landing-light">
        <div className="landing-container max-w-3xl">
          <p className="landing-eyebrow mb-4 bg-primary/10 text-primary">Story</p>
          <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-10 leading-tight">
            Our story
          </h2>
          <div className="space-y-8">
            {timeline.map((t) => (
              <div key={t.year} className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <div className="sm:w-32 shrink-0 sm:text-right">
                  <span className="inline-block text-xs sm:text-sm font-bold text-primary bg-primary/10 rounded-full px-3 py-1">
                    {t.year}
                  </span>
                </div>
                <div className="sm:border-l-2 sm:border-[var(--restaurant-mustard)]/40 sm:pl-6">
                  <p className="text-[var(--restaurant-brown)]/70 leading-relaxed text-base">
                    {t.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — DARK: Trust */}
      <section className="landing-section landing-dark">
        <div className="landing-container">
          <div className="max-w-2xl mb-10 sm:mb-12 mx-auto text-center">
            <p className="landing-eyebrow mb-4 bg-white/10 text-[var(--restaurant-yellow)]">Trust</p>
            <h2 className="resto-heading text-3xl sm:text-4xl font-bold text-white leading-tight">
              Why you can trust RestoHub
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {trustItems.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white/75"
              >
                <RestoIcon name="sparkle" className="h-4 w-4 text-[var(--restaurant-yellow)] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — LIGHT: Contact CTA */}
      <section className="landing-section landing-light">
        <div className="landing-container max-w-lg text-center">
          <p className="landing-eyebrow mb-4 bg-primary/10 text-primary">Contact</p>
          <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            Get in touch
          </h2>
          <p className="text-[var(--restaurant-brown)]/70 mb-8 leading-relaxed">
            Opening your first outlet or migrating a five-location group — we would love to hear
            from you.
          </p>
          <div className="landing-feature-light text-left space-y-4 mb-6">
            <p>
              <span className="text-xs text-muted-foreground block mb-1">Email</span>
              <a
                href={`mailto:${SITE_CONTACT.email}`}
                className="font-semibold text-primary hover:underline break-all"
              >
                {SITE_CONTACT.email}
              </a>
            </p>
            <p>
              <span className="text-xs text-muted-foreground block mb-1">Phone</span>
              <a
                href={`tel:${SITE_CONTACT.phone}`}
                className="font-semibold text-primary hover:underline"
              >
                {SITE_CONTACT.phoneDisplay}
              </a>
            </p>
          </div>
          <Link href="/signup">
            <Button className="w-full sm:w-auto rounded-full px-8 h-11">Create free account</Button>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
