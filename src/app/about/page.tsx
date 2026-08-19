import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/marketing/site-shell";
import { BreadcrumbJsonLd } from "@/components/marketing/json-ld";
import { RestoIcon } from "@/components/brand/icons";
import { SITE_CONTACT } from "@/lib/site-content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About RestoHub — Restaurant Operations Software You Can Trust",
  description:
    "RestoHub was built for real kitchens — restaurant owners, cafe operators, and cloud kitchen teams who need QR menus, stock control, table orders, and staff tools without enterprise complexity. Learn our mission and values.",
  path: "/about",
  keywords: [
    "restaurant software company",
    "food service operations platform",
    "trusted restaurant management",
    "kitchen operations software India",
  ],
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
  { year: "The problem", text: "Restaurant owners told us the same story: menus in PDFs, stock in notebooks, tasks in WhatsApp, money in Excel. Nothing talked to anything else." },
  { year: "The insight", text: "Hospitality software often feels cold and corporate. Restaurants are warm, human, urgent — tools should match that energy." },
  { year: "RestoHub", text: "We built one hub — outlets, QR menus, inventory, tables with orders, checklists, finance, team roles — so operators finally have a single place to run the house." },
  { year: "Today", text: "RestoHub grows with every outlet you add. Start free, invite your crew, and upgrade when your restaurant family outgrows the plan." },
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
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <Image src="/images/resto-trust.png" alt="About RestoHub" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--restaurant-brown)]/95 via-[var(--restaurant-brown)]/75 to-[var(--restaurant-brown)]/50" />
        <div className="container mx-auto px-4 relative z-10 text-white max-w-3xl pt-8">
          <h1 className="resto-heading text-4xl sm:text-5xl font-bold mb-6">About RestoHub</h1>
          <p className="text-lg text-white/85 leading-relaxed">
            We exist because running a restaurant should feel like hospitality — not homework.
            RestoHub gives owners, managers, and staff one trusted place to work together.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-14 items-start mb-20">
            <div>
              <h2 className="resto-heading text-3xl font-bold mb-6 text-[var(--restaurant-brown)]">Our mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                RestoHub&apos;s mission is to give every restaurant — from a single-family dhaba to
                a multi-city brand — the operational backbone that big chains take for granted,
                without the enterprise price tag or six-month implementation.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We believe when back-of-house runs smoothly, front-of-house smiles more. When
                managers see low stock before service, guests never hear &ldquo;sorry, that&apos;s
                finished.&rdquo; When checklists are tracked, health inspections and brand standards
                stop being panic events.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                That is why we integrated menus, stock, tables, tasks, money, and people into
                one product instead of selling you ten integrations.
              </p>
            </div>
            <div className="relative h-80 rounded-3xl overflow-hidden shadow-xl">
              <Image src="/images/resto-kitchen.png" alt="Kitchen team" fill className="object-cover" />
            </div>
          </div>

          <h2 className="resto-heading text-3xl font-bold text-center mb-12 text-[var(--restaurant-brown)]">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-6 mb-20">
            {values.map((v) => (
              <div key={v.title} className="resto-card p-6 border-0">
                <h3 className="resto-heading font-bold text-lg mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>

          <h2 className="resto-heading text-3xl font-bold text-center mb-12 text-[var(--restaurant-brown)]">Our story</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            {timeline.map((t) => (
              <div key={t.year} className="flex gap-6">
                <div className="shrink-0 w-28 text-right">
                  <span className="text-sm font-bold text-primary">{t.year}</span>
                </div>
                <div className="border-l-2 border-secondary pl-6 pb-2">
                  <p className="text-muted-foreground leading-relaxed">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/15 border-y border-border/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="resto-heading text-3xl font-bold text-center mb-8 text-[var(--restaurant-brown)]">
            Why you can trust RestoHub
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            {[
              "Invite-only access — strangers cannot browse your dashboard.",
              "Role-based security — staff cannot see finance or delete menus.",
              "Outlet-scoped data — Kolkata stock does not mix with Mumbai stock.",
              "Owner protection — organization creator cannot be removed by mistake.",
              "Clear privacy policy — we tell you exactly what we store.",
              "Direct support — email and phone to real people, not ticket black holes.",
              "Free tier — try everything core before you pay a rupee.",
              "No lock-in marketing — export your workflow knowledge via our Docs anytime.",
            ].map((item) => (
              <div key={item} className="flex gap-2 resto-card p-4 border-0">
                <RestoIcon name="sparkle" className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="resto-heading text-3xl font-bold mb-4">Get in touch</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Whether you are opening your first outlet or migrating a five-location group, we would
            love to hear from you.
          </p>
          <div className="resto-card p-8 border-0 inline-block text-left w-full max-w-md">
            <p className="mb-4">
              <span className="text-muted-foreground text-sm block">Email</span>
              <a href={`mailto:${SITE_CONTACT.email}`} className="font-semibold text-primary hover:underline">
                {SITE_CONTACT.email}
              </a>
            </p>
            <p className="mb-6">
              <span className="text-muted-foreground text-sm block">Phone</span>
              <a href={`tel:${SITE_CONTACT.phone}`} className="font-semibold text-primary hover:underline">
                {SITE_CONTACT.phoneDisplay}
              </a>
            </p>
            <Link href="/signup">
              <Button className="w-full rounded-full">Create free account</Button>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
