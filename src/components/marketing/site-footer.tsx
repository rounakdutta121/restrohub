import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { RestoIcon } from "@/components/brand/icons";
import { PUBLIC_NAV, SITE_CONTACT } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t bg-[var(--restaurant-brown)] text-white/85">
      <div className="container mx-auto px-4 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <LogoMark size="sm" />
            <span className="resto-heading font-bold text-white text-lg">RestoHub</span>
          </div>
          <p className="text-sm leading-relaxed text-white/70 max-w-xs">
            One warm platform for multi-outlet restaurants — menus, stock, tables, checklists,
            finance, and your whole team.
          </p>
        </div>

        <div>
          <h4 className="resto-heading font-semibold text-white mb-4">Explore</h4>
          <ul className="space-y-2 text-sm">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-[var(--restaurant-yellow)] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className="hover:text-[var(--restaurant-yellow)] transition-colors">
                Log in
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-[var(--restaurant-yellow)] transition-colors">
                Sign up free
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="resto-heading font-semibold text-white mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href={`mailto:${SITE_CONTACT.email}`}
                className="hover:text-[var(--restaurant-yellow)] transition-colors break-all"
              >
                {SITE_CONTACT.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${SITE_CONTACT.phone}`}
                className="hover:text-[var(--restaurant-yellow)] transition-colors"
              >
                {SITE_CONTACT.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="resto-heading font-semibold text-white mb-4">Why RestoHub</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex gap-2"><span className="text-[var(--restaurant-yellow)]">✓</span> Built for real kitchens</li>
            <li className="flex gap-2"><span className="text-[var(--restaurant-yellow)]">✓</span> Role-based team access</li>
            <li className="flex gap-2"><span className="text-[var(--restaurant-yellow)]">✓</span> INR & multi-currency</li>
            <li className="flex gap-2"><span className="text-[var(--restaurant-yellow)]">✓</span> Free for this release</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/60">
          <p className="inline-flex items-center gap-1.5">
            © {new Date().getFullYear()} {SITE_CONTACT.company}. Made with
            <RestoIcon name="flame" className="h-3.5 w-3.5 text-[var(--restaurant-yellow)]" />
            for restaurants worldwide.
          </p>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
