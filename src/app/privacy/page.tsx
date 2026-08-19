import Link from "next/link";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="resto-heading text-xl font-bold text-[var(--restaurant-brown)] mb-4">{title}</h2>
      <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">{children}</div>
    </section>
  );
}

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
      <section className="py-16 sm:py-20 bg-secondary/15 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="resto-heading text-4xl font-bold mb-4 text-[var(--restaurant-brown)]">Privacy Policy</h1>
          <p className="text-muted-foreground leading-relaxed">
            Effective date: {effective}. RestoHub (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the
            RestoHub web application and related services. This policy explains how we handle information
            when you use our platform.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <Section title="1. Who this policy applies to">
            <p>
              This policy applies to restaurant owners, administrators, managers, staff, and anyone
              who creates an account or accepts an invite to a RestoHub organization. It also applies
              to visitors of our marketing pages (Home, Services, About) and guests who view public
              QR menus — though guests do not need an account and we collect minimal data from them.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <p><strong className="text-foreground">Account information:</strong> When you register, we collect your name, email address, and password (stored in hashed form). If you sign in via supported providers in the future, we may receive profile data from those providers.</p>
            <p><strong className="text-foreground">Organization & outlet data:</strong> Business names, outlet addresses, cities, countries, currencies, timezones, menu items, prices, inventory quantities, table configurations, finance entries, checklist content, and team member roles you enter into the platform.</p>
            <p><strong className="text-foreground">Operational data:</strong> Table orders, checklist run progress, notifications, invite tokens, and audit-related timestamps (created/updated dates).</p>
            <p><strong className="text-foreground">Technical data:</strong> Standard server logs may include IP address, browser type, and pages accessed for security and debugging. Session cookies are used to keep you logged in.</p>
            <p><strong className="text-foreground">Public menu views:</strong> Guests scanning QR codes see menu content you publish. We do not require guest accounts and do not intentionally collect guest personal information through public menus.</p>
          </Section>

          <Section title="3. How we use your information">
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide and maintain the RestoHub service — dashboards, APIs, notifications, and public menus.</li>
              <li>Authenticate users and enforce role-based permissions within your organization.</li>
              <li>Send operational notifications (low stock, overdue checklists) to appropriate team members.</li>
              <li>Process invite links so new staff can join your organization securely.</li>
              <li>Improve reliability, fix bugs, and develop new features.</li>
              <li>Respond to support requests sent to {SITE_CONTACT.email} or {SITE_CONTACT.phoneDisplay}.</li>
            </ul>
            <p>We do not sell your restaurant data to third parties for advertising purposes.</p>
          </Section>

          <Section title="4. How we share information">
            <p><strong className="text-foreground">Within your organization:</strong> Data you enter is visible to members according to their role. For example, staff see menus and tables; managers additionally see finance; admins manage team invites.</p>
            <p><strong className="text-foreground">Public menus:</strong> Menu categories, item names, descriptions, and prices you publish are visible to anyone with the outlet&apos;s public URL or QR code.</p>
            <p><strong className="text-foreground">Service providers:</strong> We use infrastructure providers (such as cloud hosting and database services) to run RestoHub. These providers process data on our behalf under contractual obligations to protect it.</p>
            <p><strong className="text-foreground">Legal requirements:</strong> We may disclose information if required by law, court order, or to protect the rights, safety, and security of RestoHub, our users, or the public.</p>
          </Section>

          <Section title="5. Data storage & security">
            <p>
              RestoHub stores application data in secure cloud databases. Passwords are hashed; we do
              not store plain-text passwords. Access to production systems is restricted. We use HTTPS
              for data in transit.
            </p>
            <p>
              No system is 100% secure. You are responsible for keeping your login credentials
              confidential and for assigning appropriate roles to team members. We recommend removing
              members who leave your restaurant promptly.
            </p>
          </Section>

          <Section title="6. Data retention">
            <p>
              We retain your organization data while your account and organization remain active. If
              an Owner deletes an organization, associated outlets, menus, inventory, finance entries,
              and team memberships are removed from our systems subject to backup retention cycles.
            </p>
            <p>
              You may request deletion of your personal account by contacting us. Some data may
              remain in backups for a limited period before automatic purging.
            </p>
          </Section>

          <Section title="7. Your rights & choices">
            <p>Depending on your location, you may have rights to access, correct, or delete personal data we hold about you. To exercise these rights, contact us at {SITE_CONTACT.email}.</p>
            <p>Organization Owners can delete entire organizations from Settings. Admins can remove team members and revoke invites. Managers can delete operational records (menu items, finance entries, etc.) within their permissions.</p>
            <p>You can opt out of non-essential communications by contacting support. Operational notifications (e.g. low stock) are part of the core service for users with appropriate roles.</p>
          </Section>

          <Section title="8. Cookies & sessions">
            <p>
              RestoHub uses session cookies and local storage (e.g. active organization and outlet
              selection) to provide a smooth dashboard experience. These are necessary for authentication
              and are not used for third-party advertising.
            </p>
          </Section>

          <Section title="9. Children&apos;s privacy">
            <p>
              RestoHub is a business-to-business service for restaurant operators. It is not directed
              at children under 16. We do not knowingly collect personal information from children.
            </p>
          </Section>

          <Section title="10. International users">
            <p>
              RestoHub serves restaurants globally. Your data may be processed in countries other than
              your own. By using the service, you consent to such processing where permitted by law.
              We support multiple currencies (including INR) for outlet financial display — this is
              a formatting preference, not a data localization guarantee.
            </p>
          </Section>

          <Section title="11. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. We will post the revised version
              on this page with an updated effective date. Continued use of RestoHub after changes
              constitutes acceptance of the updated policy. Material changes may additionally be
              communicated via email or in-app notice where appropriate.
            </p>
          </Section>

          <Section title="12. Contact us">
            <p>
              For privacy questions, data requests, or security concerns, contact:
            </p>
            <p>
              <strong className="text-foreground">Email:</strong>{" "}
              <a href={`mailto:${SITE_CONTACT.email}`} className="text-primary hover:underline">{SITE_CONTACT.email}</a>
              <br />
              <strong className="text-foreground">Phone:</strong>{" "}
              <a href={`tel:${SITE_CONTACT.phone}`} className="text-primary hover:underline">{SITE_CONTACT.phoneDisplay}</a>
            </p>
            <p>
              See also our <Link href="/about" className="text-primary hover:underline">About</Link> page
              and <Link href="/services" className="text-primary hover:underline">Services</Link> overview
              for how RestoHub works.
            </p>
          </Section>
        </div>
      </section>
    </SiteShell>
  );
}
