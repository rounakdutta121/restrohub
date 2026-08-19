import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/marketing/site-shell";
import { HomeFaqJsonLd } from "@/components/marketing/json-ld";
import { RestoIcon, RestoIconBadge, type RestoIconName } from "@/components/brand/icons";
import { SITE_CONTACT } from "@/lib/site-content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Restaurant Management Software & QR Digital Menus",
  description:
    "RestoHub helps restaurants, cafes, dhabas, and cloud kitchens run smarter — multi-outlet dashboards, QR food menus, kitchen inventory, table orders, prep checklists, staff management, and INR-ready finance. Start free today.",
  path: "/",
  keywords: [
    "free restaurant management software",
    "restaurant QR menu generator",
    "food business software India",
    "restaurant operations hub",
    "digital food menu",
  ],
});

const features: { icon: RestoIconName; title: string; desc: string }[] = [
  { icon: "outlets", title: "Every outlet, one hub", desc: "Mumbai, Kolkata, Dubai — manage every location from a single organization dashboard with outlet switching in one click." },
  { icon: "mobile", title: "QR menus guests love", desc: "Publish beautiful mobile menus per outlet. Guests scan, browse, and see prices in your local currency — INR, USD, and more." },
  { icon: "stock", title: "Stock & low-stock alerts", desc: "Track ingredients per outlet, set reorder levels, and get notified before the kitchen runs dry." },
  { icon: "prep", title: "Kitchen checklists", desc: "Prep, opening, closing, and maintenance SOPs with assignable runs and compliance tracking." },
  { icon: "tables", title: "Tables & in-house orders", desc: "Seat guests, take orders from your live menu, and free tables when service is done." },
  { icon: "finance", title: "Finance per outlet", desc: "Log income and expenses in the outlet's currency. See monthly profit at a glance." },
  { icon: "team", title: "Role-based team access", desc: "Owner, Admin, Manager, and Staff — everyone sees exactly what they need, nothing more." },
  { icon: "bell", title: "Smart notifications", desc: "Low stock, overdue checklists, and maintenance reminders land in one inbox." },
  { icon: "settings", title: "Plans that scale", desc: "Start free with one outlet. Upgrade when your restaurant family grows." },
];

const advantages = [
  "Replace scattered spreadsheets, WhatsApp groups, and paper checklists with one system.",
  "Staff take table orders directly from the menu you already maintain — no double entry.",
  "Managers see finance and stock; staff focus on service — permissions built in.",
  "Multi-outlet groups finally share one team, one invite system, one source of truth.",
  "QR menus update instantly when you change prices — no reprinting.",
  "Built for Indian restaurants and global chains alike — INR formatting, local phone support.",
];

export default function HomePage() {
  return (
    <SiteShell>
      <HomeFaqJsonLd />
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <Image src="/images/resto-hero.png" alt="RestoHub restaurant management software for multi-outlet food businesses" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--restaurant-brown)]/90 via-[var(--restaurant-brown)]/65 to-[var(--restaurant-brown)]/20" />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--restaurant-yellow)]/90 text-sm font-semibold text-[var(--restaurant-brown)] mb-6">
              <RestoIcon name="brand" className="h-4 w-4" />
              Trusted by restaurant operators who care about hospitality
            </span>
            <h1 className="resto-heading text-4xl sm:text-6xl font-bold text-white leading-[1.08] mb-6">
              Run every outlet.
              <br />
              <span className="text-[var(--restaurant-yellow)]">Delight every guest.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/85 mb-10 max-w-2xl leading-relaxed">
              RestoHub is the all-in-one operations platform for restaurants — digital menus,
              inventory, table orders, checklists, finance, and your entire team in one warm,
              easy-to-use hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-xl hover:scale-105 transition-transform">
                  Start free — no card needed
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base">
                  Explore all services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why RestoHub */}
      <section className="py-20 bg-secondary/15 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-6 text-[var(--restaurant-brown)]">
                Why restaurants choose RestoHub
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Running a restaurant is already hard. You should not need five different apps
                for menus, stock, staff tasks, and money. RestoHub brings operational clarity
                to owners, managers, and floor staff — so you spend less time chasing updates
                and more time on the food and guests you love.
              </p>
              <ul className="space-y-3">
                {advantages.map((a) => (
                  <li key={a} className="flex gap-3 text-sm leading-relaxed">
                    <span className="text-primary font-bold shrink-0">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-80 sm:h-[28rem] rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/60">
              <Image src="/images/resto-trust.png" alt="Restaurant team using food service operations software" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-20 sm:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-3">Everything in one platform</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From the walk-in to the walk-out — tools designed around how restaurants actually work.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="resto-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
              >
                <RestoIconBadge name={f.icon} size="md" className="mb-3 bg-primary/10" />
                <h3 className="resto-heading font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/services">
              <Button variant="outline" className="rounded-full px-8">See detailed service breakdown →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* QR Menu */}
      <section className="relative py-20 sm:py-28 menu-gradient overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-2xl">
              <Image src="/images/resto-food-spread.png" alt="Digital QR food menu for restaurant guests" fill className="object-cover" />
            </div>
            <div>
              <h2 className="resto-heading text-3xl font-bold text-[var(--restaurant-brown)] mb-4">
                Menus your guests will actually use
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Each outlet gets its own public menu page and downloadable QR code. Update a
                price once — every table tent and guest phone reflects it immediately. Prices
                display in your outlet currency, whether that is INR, USD, or anything else.
              </p>
              <Link href="/signup">
                <Button className="rounded-full px-8">Create your first QR menu</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-background border-t border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="resto-heading text-3xl font-bold mb-4">Questions? Talk to a real person.</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We are building RestoHub for operators like you — not venture slides. Reach out anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href={`mailto:${SITE_CONTACT.email}`} className="resto-card px-6 py-4 hover:shadow-md transition-shadow">
              <span className="text-muted-foreground block mb-1">Email</span>
              <span className="font-semibold text-primary">{SITE_CONTACT.email}</span>
            </a>
            <a href={`tel:${SITE_CONTACT.phone}`} className="resto-card px-6 py-4 hover:shadow-md transition-shadow">
              <span className="text-muted-foreground block mb-1">Phone</span>
              <span className="font-semibold text-primary">{SITE_CONTACT.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="resto-heading text-3xl font-bold mb-3">Start free. Grow when you are ready.</h2>
          <p className="text-muted-foreground mb-8">Free, Pro, and Business plans — upgrade from Settings when your chain expands.</p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-10">Create your free account</Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <Image src="/images/resto-operations.png" alt="" fill className="object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-primary/88" />
        <div className="container mx-auto px-4 text-center relative z-10 text-primary-foreground">
          <h2 className="resto-heading text-3xl sm:text-4xl font-bold mb-4">Your kitchen deserves better tools</h2>
          <p className="opacity-90 mb-8 max-w-xl mx-auto text-lg leading-relaxed">
            Join restaurant owners who replaced chaos with clarity — and gave their guests a smoother experience.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="rounded-full px-10 h-12 font-semibold shadow-xl hover:scale-105 transition-transform">
              Get started in minutes
            </Button>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
