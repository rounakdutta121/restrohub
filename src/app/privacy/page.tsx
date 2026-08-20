import Link from "next/link";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/marketing/site-shell";
import { BreadcrumbJsonLd } from "@/components/marketing/json-ld";
import { SITE_CONTACT } from "@/lib/site-content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy — Restaurant Data Protection",
  description:
    "RestoHub privacy policy for restaurant operators: how we collect, store, and protect your food business data, team accounts, outlet menus, inventory, and finance records.",
  path: "/privacy",
  keywords: [
    "restaurant software privacy",
    "food business data protection",
    "restaurant SaaS privacy policy",
  ],
});

const policySections: { title: string; body: ReactNode }[] = [
  {
    title: "1. Who this policy applies to",
    body: (
      <p>
        This policy applies to restaurant owners, administrators, managers, staff, and anyone who
        creates an account or accepts an invite to a RestoHub organization. It also applies to
        visitors of our marketing pages and guests who view public QR menus — though guests do not
        need an account and we collect minimal data from them.
      </p>
    ),
  },
  {
    title: "2. Information we collect",
    body: (
      <>
        <p>
          <strong>Account information:</strong> When you register, we collect your name, email
          address, and password (stored in hashed form). If you sign in via supported providers, we
          may receive profile data from those providers.
        </p>
        <p>
          <strong>Organization & outlet data:</strong> Business names, outlet addresses, cities,
          countries, currencies, timezones, menu items, prices, inventory quantities, table
          configurations, finance entries, checklist content, and team member roles you enter into
          the platform.
        </p>
        <p>
          <strong>Operational data:</strong> Table orders, checklist run progress, notifications,
          invite tokens, and audit-related timestamps.
        </p>
        <p>
          <strong>Technical data:</strong> Standard server logs may include IP address, browser
          type, and pages accessed for security and debugging. Session cookies keep you logged in.
        </p>
        <p>
          <strong>Public menu views:</strong> Guests scanning QR codes see menu content you
          publish. We do not require guest accounts and do not intentionally collect guest personal
          information through public menus.
        </p>
      </>
    ),
  },
  {
    title: "3. How we use your information",
    body: (
      <>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide and maintain RestoHub — dashboards, APIs, notifications, and public menus.</li>
          <li>Authenticate users and enforce role-based permissions within your organization.</li>
          <li>Send operational notifications (low stock, overdue checklists) to the right people.</li>
          <li>Process invite links so new staff can join securely.</li>
          <li>Improve reliability, fix bugs, and develop new features.</li>
          <li>
            Respond to support requests sent to {SITE_CONTACT.email} or {SITE_CONTACT.phoneDisplay}.
          </li>
        </ul>
        <p>We do not sell your restaurant data to third parties for advertising purposes.</p>
      </>
    ),
  },
  {
    title: "4. How we share information",
    body: (
      <>
        <p>
          <strong>Within your organization:</strong> Data is visible to members according to their
          role. Staff see menus and tables; managers additionally see finance; admins manage team
          invites.
        </p>
        <p>
          <strong>Public menus:</strong> Menu categories, item names, descriptions, and prices you
          publish are visible to anyone with the outlet&apos;s public URL or QR code.
        </p>
        <p>
          <strong>Service providers:</strong> Cloud hosting and database providers process data on
          our behalf under contractual obligations to protect it.
        </p>
        <p>
          <strong>Legal requirements:</strong> We may disclose information if required by law, court
          order, or to protect the rights and safety of RestoHub, our users, or the public.
        </p>
      </>
    ),
  },
  {
    title: "5. Data storage & security",
    body: (
      <>
        <p>
          Application data is stored in secure cloud databases. Passwords are hashed — we never
          store plain-text passwords. Access to production systems is restricted. We use HTTPS for
          data in transit.
        </p>
        <p>
          No system is 100% secure. Keep your credentials confidential and assign appropriate
          roles. Remove members who leave your restaurant promptly.
        </p>
      </>
    ),
  },
  {
    title: "6. Data retention",
    body: (
      <>
        <p>
          We retain organization data while your account and organization remain active. If an Owner
          deletes an organization, associated outlets, menus, inventory, finance entries, and team
          memberships are removed subject to backup retention cycles.
        </p>
        <p>
          You may request deletion of your personal account by contacting us. Some data may remain
          in backups for a limited period before automatic purging.
        </p>
      </>
    ),
  },
  {
    title: "7. Your rights & choices",
    body: (
      <>
        <p>
          Depending on your location, you may have rights to access, correct, or delete personal
          data we hold about you. Contact us at {SITE_CONTACT.email}.
        </p>
        <p>
          Organization Owners can delete entire organizations from Settings. Admins can remove team
          members and revoke invites. Managers can delete operational records within their
          permissions.
        </p>
      </>
    ),
  },
  {
    title: "8. Cookies & sessions",
    body: (
      <p>
        RestoHub uses session cookies and local storage (e.g. active organization and outlet
        selection) for authentication and dashboard continuity. These are not used for third-party
        advertising.
      </p>
    ),
  },
  {
    title: "9. Children's privacy",
    body: (
      <p>
        RestoHub is a business-to-business service for restaurant operators. It is not directed at
        children under 16. We do not knowingly collect personal information from children.
      </p>
    ),
  },
  {
    title: "10. International users",
    body: (
      <p>
        RestoHub serves restaurants globally. Your data may be processed in countries other than
        your own. By using the service, you consent to such processing where permitted by law.
        Multiple currencies (including INR) are display preferences, not a data localization
        guarantee.
      </p>
    ),
  },
  {
    title: "11. Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. The revised version will be posted on
        this page with an updated effective date. Continued use after changes constitutes
        acceptance. Material changes may also be communicated via email or in-app notice.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  const effective = "August 19, 2026";

  return (
    <SiteShell>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]}
      />

      {/* 1 — DARK: Hero */}
      <section className="landing-section landing-dark !py-20 sm:!py-28">
        <div className="landing-container max-w-3xl">
          <p className="landing-eyebrow mb-5 bg-[var(--restaurant-yellow)] text-[var(--restaurant-brown)]">
            Legal
          </p>
          <h1 className="resto-heading text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-white/75 leading-relaxed text-base sm:text-lg">
            Effective date: {effective}. RestoHub (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            &ldquo;our&rdquo;) operates the RestoHub web application and related services. This
            policy explains how we handle information when you use our platform.
          </p>
        </div>
      </section>

      {/* 2 — LIGHT: Policy body (odd sections) + DARK alternating via cards */}
      <section className="landing-section landing-light !py-12 sm:!py-16">
        <div className="landing-container max-w-3xl space-y-4">
          {policySections.map((s, i) => {
            const dark = i % 2 === 1;
            return (
              <article
                key={s.title}
                className={
                  dark
                    ? "rounded-2xl border border-white/10 bg-[var(--restaurant-brown)] p-6 sm:p-8 text-[#fff8eb]"
                    : "landing-feature-light p-6 sm:p-8"
                }
              >
                <h2
                  className={`resto-heading text-lg sm:text-xl font-bold mb-4 ${
                    dark ? "text-white" : "text-[var(--restaurant-brown)]"
                  }`}
                >
                  {s.title}
                </h2>
                <div
                  className={`space-y-4 text-sm leading-relaxed ${
                    dark ? "text-white/70 [&_strong]:text-[var(--restaurant-yellow)]" : "text-[var(--restaurant-brown)]/70 [&_strong]:text-[var(--restaurant-brown)]"
                  }`}
                >
                  {s.body}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3 — DARK: Contact */}
      <section className="landing-section landing-dark !py-16 sm:!py-20">
        <div className="landing-container max-w-3xl">
          <p className="landing-eyebrow mb-4 bg-white/10 text-[var(--restaurant-yellow)]">
            Contact
          </p>
          <h2 className="resto-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Privacy questions?
          </h2>
          <p className="text-white/65 text-sm sm:text-base leading-relaxed mb-6">
            For privacy questions, data requests, or security concerns:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-4 hover:bg-white/[0.1] transition-colors"
            >
              <span className="text-xs text-white/50 block mb-1">Email</span>
              <span className="font-semibold text-[var(--restaurant-yellow)] break-all text-sm">
                {SITE_CONTACT.email}
              </span>
            </a>
            <a
              href={`tel:${SITE_CONTACT.phone}`}
              className="rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-4 hover:bg-white/[0.1] transition-colors"
            >
              <span className="text-xs text-white/50 block mb-1">Phone</span>
              <span className="font-semibold text-[var(--restaurant-yellow)] text-sm">
                {SITE_CONTACT.phoneDisplay}
              </span>
            </a>
          </div>
          <p className="text-sm text-white/50">
            See also{" "}
            <Link href="/about" className="text-[var(--restaurant-yellow)] hover:underline">
              About
            </Link>{" "}
            and{" "}
            <Link href="/services" className="text-[var(--restaurant-yellow)] hover:underline">
              Services
            </Link>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
