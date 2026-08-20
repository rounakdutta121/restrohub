"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RestoPageHeader } from "@/components/brand/page-header";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

const sections: { id: string; label: string; icon: RestoIconName }[] = [
  { id: "overview", label: "Overview", icon: "brand" },
  { id: "getting-started", label: "Getting started", icon: "home" },
  { id: "roles", label: "Roles & permissions", icon: "team" },
  { id: "outlets", label: "Outlets", icon: "outlets" },
  { id: "menus", label: "Menus & QR", icon: "menus" },
  { id: "inventory", label: "Stock", icon: "stock" },
  { id: "checklists", label: "Prep & checklists", icon: "prep" },
  { id: "runs", label: "Runs", icon: "runs" },
  { id: "tables", label: "Tables & orders", icon: "tables" },
  { id: "finance", label: "Finance", icon: "finance" },
  { id: "team", label: "Team & invites", icon: "team" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "tips", label: "Tips & workflows", icon: "sparkle" },
];

function DocSection({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: RestoIconName;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <Card className="resto-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="resto-heading text-lg flex items-center gap-2">
            <RestoIcon name={icon} className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose-resto space-y-4 text-sm text-muted-foreground leading-relaxed">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function StepList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal list-inside space-y-2 pl-1">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

function RoleRow({ role, access }: { role: Role; access: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-border/40 last:border-0">
      <Badge className="rounded-full w-fit capitalize">{ROLE_LABELS[role]}</Badge>
      <span>{access}</span>
    </div>
  );
}

function FeatureLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-primary font-medium hover:underline">
      {label}
    </Link>
  );
}

export default function DocsPage() {
  return (
    <div className="space-y-6 w-full animate-fade-in">
      <RestoPageHeader
        title="RestoHub Docs"
        subtitle="Everything you need to run your restaurant on RestoHub"
        icon="docs"
        image="/images/resto-kitchen.png"
      />

      <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Table of contents */}
        <nav className="lg:sticky lg:top-28 resto-card p-4 border-0 hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            On this page
          </p>
          <ul className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md hover:bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RestoIcon name={s.icon} className="h-3.5 w-3.5 shrink-0" />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6 min-w-0">
          <DocSection id="overview" title="Overview" icon="brand">
            <p>
              RestoHub is a multi-outlet restaurant operations platform. You manage one{" "}
              <strong className="text-foreground">organization</strong> (your restaurant group)
              with multiple <strong className="text-foreground">outlets</strong> (locations).
              Each outlet has its own menu, stock, tables, and finance — while checklists and
              team span the whole organization.
            </p>
            <p>
              Use the <strong className="text-foreground">organization</strong> and{" "}
              <strong className="text-foreground">outlet</strong> dropdowns in the top bar to
              switch context. Most pages (Menus, Stock, Tables, Finance) work on the currently
              selected outlet.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {[
                { icon: "menus" as const, label: "Digital menus + QR for guests" },
                { icon: "stock" as const, label: "Ingredient & stock tracking" },
                { icon: "prep" as const, label: "Prep & maintenance checklists" },
                { icon: "tables" as const, label: "Table seating & in-house orders" },
                { icon: "finance" as const, label: "Income & expense ledger" },
                { icon: "team" as const, label: "Role-based team access" },
              ].map((f) => (
                <div
                  key={f.label}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/10 px-3 py-2"
                  )}
                >
                  <RestoIcon name={f.icon} className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="getting-started" title="Getting started" icon="home">
            <p>Follow this order when setting up a new restaurant group:</p>
            <StepList
              items={[
                "Sign up and log in at /signup.",
                "Go to Settings → create your organization (e.g. \"DamnArt\").",
                "As Admin, add outlets under Outlets — one card per location (name, city, currency).",
                "Build the menu under Menus — categories, items, then download the QR code for guest ordering.",
                "Add ingredients and stock levels under Stock for the selected outlet.",
                "Create prep/opening/closing checklists under Prep, then assign runs under Runs.",
                "Add tables under Tables, seat guests, and take orders from your menu.",
                "Invite staff under Team — assign roles and outlet access.",
                "Track sales and costs under Finance (managers and above).",
              ]}
            />
            <p>
              Quick links:{" "}
              <FeatureLink href="/dashboard/settings" label="Settings" />,{" "}
              <FeatureLink href="/dashboard/outlets" label="Outlets" />,{" "}
              <FeatureLink href="/dashboard/menus" label="Menus" />.
            </p>
          </DocSection>

          <DocSection id="roles" title="Roles & permissions" icon="team">
            <p>
              Every team member has a role. Your role badge appears in the top bar. Pages and
              actions are restricted so staff only see what they need for daily operations.
            </p>
            <div className="rounded-lg border bg-secondary/10 p-4 space-y-0">
              <RoleRow
                role="owner"
                access="Full access — delete organization, outlets, team, and all outlet operations."
              />
              <RoleRow
                role="admin"
                access="Manage outlets, invite team, and all outlet operations. Cannot delete the organization."
              />
              <RoleRow
                role="manager"
                access="Edit menus, stock, finance, table setup, and checklists. View-only on menus/stock for reference."
              />
              <RoleRow
                role="staff"
                access="Run checklists, seat guests, take table orders. View menus and stock (read-only). No finance or team access."
              />
            </div>
            <p>
              <strong className="text-foreground">Owner vs invites:</strong> Owner is the
              top-level role and is assigned automatically when someone creates the organization.
              You cannot invite someone as Owner — only Staff, Manager, or Admin.
            </p>
            <p>
              Staff assigned to specific outlets only see those outlets in the outlet picker.
              Admins and owners see every outlet in the organization.
            </p>
          </DocSection>

          <DocSection id="outlets" title="Outlets" icon="outlets">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/outlets" label="Outlets" /> in the nav bar.
            </p>
            <p>
              <strong className="text-foreground">Who:</strong> Admins and owners can create and
              delete outlets. All roles can view outlets they are assigned to.
            </p>
            <p>
              <strong className="text-foreground">How to use:</strong>
            </p>
            <StepList
              items={[
                "Click + Add Outlet and fill in name, address, city, country, and currency.",
                "Currency is used on menus, table orders, and finance for that location.",
                "Each outlet gets a unique public menu URL: /m/your-outlet-slug.",
                "Select an outlet from the top bar before working on menus, stock, tables, or finance.",
                "Add as many outlets as you need — there are no plan limits in this release.",
              ]}
            />
          </DocSection>

          <DocSection id="menus" title="Menus & QR codes" icon="menus">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/menus" label="Menus" /> (outlet-scoped).
            </p>
            <p>
              <strong className="text-foreground">Who:</strong> Managers and above can add
              categories and items. Staff can view the menu (useful when taking table orders).
            </p>
            <p>
              <strong className="text-foreground">How to use:</strong>
            </p>
            <StepList
              items={[
                "Select your outlet in the top bar.",
                "Add a category (e.g. Starters, Mains, Drinks).",
                "Add items with name, price, and optional description.",
                "Mark items unavailable by toggling availability when editing.",
                "Download the QR code — print it on table tents or at the entrance.",
                "Guests scan the QR to open the public menu at /m/outlet-slug (no login required).",
              ]}
            />
            <p>
              <strong className="text-foreground">Table orders:</strong> When staff seat guests
              under Tables, they pick items from this same menu to build in-house orders.
            </p>
          </DocSection>

          <DocSection id="inventory" title="Stock & ingredients" icon="stock">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/inventory" label="Stock" /> in the nav.
            </p>
            <p>
              <strong className="text-foreground">Who:</strong> Managers edit; staff can view
              current levels.
            </p>
            <p>
              <strong className="text-foreground">How to use:</strong>
            </p>
            <StepList
              items={[
                "Step 1 — Add an ingredient once for the whole business (name + unit, e.g. flour in kg).",
                "Step 2 — Select that ingredient and set how much you have at this outlet.",
                "Set a minimum (reorder) level — you get a low-stock notification when quantity drops below it.",
                "Update quantities whenever you receive a delivery or use stock.",
                "Use units like kg, litres, or pieces — do not combine numbers into the unit field.",
              ]}
            />
            <p>
              The Home dashboard shows a low-stock count for the selected outlet. Check{" "}
              <FeatureLink href="/dashboard/notifications" label="Notifications" /> for alerts.
            </p>
          </DocSection>

          <DocSection id="checklists" title="Prep & checklists" icon="prep">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/checklists" label="Prep" /> to create templates;{" "}
              <FeatureLink href="/dashboard/runs" label="Runs" /> to execute them.
            </p>
            <p>
              <strong className="text-foreground">Who:</strong> Managers create and edit
              checklists. All staff can start and complete runs.
            </p>
            <p>
              <strong className="text-foreground">Checklist types:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong className="text-foreground">Prep</strong> — daily kitchen prep (mise en place, sauces, marinades)</li>
              <li><strong className="text-foreground">Opening</strong> — tasks before service (lights, cash float, equipment checks)</li>
              <li><strong className="text-foreground">Closing</strong> — end-of-day shutdown (cleaning, lock-up, waste log)</li>
              <li><strong className="text-foreground">Maintenance</strong> — periodic equipment and facility checks</li>
            </ul>
            <p>
              <strong className="text-foreground">How to create a checklist:</strong>
            </p>
            <StepList
              items={[
                "Go to Prep → click + prep (or opening / closing / maintenance).",
                "Open the checklist → edit title, type, and steps.",
                "Each step has a title and optional description.",
                "Save — the checklist is now available for runs.",
              ]}
            />
          </DocSection>

          <DocSection id="runs" title="Checklist runs" icon="runs">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/runs" label="Runs" />.
            </p>
            <p>
              A <strong className="text-foreground">run</strong> is one execution of a checklist
              — assigned to a person, optionally with a due date and outlet.
            </p>
            <StepList
              items={[
                "Click New Run → pick a checklist, assignee, outlet, and optional due date.",
                "Expand a run and tick off steps as they are completed.",
                "Status moves from pending → in progress → completed automatically.",
                "Overdue runs (past due date, not completed) appear on the Home dashboard.",
                "Managers can delete runs; staff cannot.",
              ]}
            />
            <p>
              Use runs for accountability — e.g. opening checklist assigned to the opening shift
              lead every morning.
            </p>
          </DocSection>

          <DocSection id="tables" title="Tables & orders" icon="tables">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/tables" label="Tables" />.
            </p>
            <p>
              <strong className="text-foreground">Who:</strong> Managers add/remove table
              definitions. All staff can seat guests and manage orders.
            </p>
            <p>
              <strong className="text-foreground">Setup (managers):</strong>
            </p>
            <StepList
              items={[
                "Add tables with a label (T1, Patio 3) and seat capacity.",
                "Tables show as available, occupied, or reserved.",
              ]}
            />
            <p>
              <strong className="text-foreground">Seating & orders (staff):</strong>
            </p>
            <StepList
              items={[
                "Click Seat Guests or Seat & order on an available table.",
                "Enter guest name and party size.",
                "Optionally add menu items from your outlet menu to the cart.",
                "Confirm — table becomes occupied; order total is shown on the card.",
                "For occupied tables: Add menu items to append to the order, or Free table when guests leave.",
                "Orders are optional — you can seat guests without ordering.",
              ]}
            />
          </DocSection>

          <DocSection id="finance" title="Finance" icon="finance">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/finance" label="Finance" /> and summary on{" "}
              <FeatureLink href="/dashboard" label="Home" />.
            </p>
            <p>
              <strong className="text-foreground">Who:</strong> Managers and above. Hidden from
              staff.
            </p>
            <p>
              Manual ledger — log income and expenses per outlet, per month.
            </p>
            <StepList
              items={[
                "Select outlet → Add Entry.",
                "Choose type (income or expense), amount, category, date, and optional note.",
                "Categories include sales, rent, utilities, salaries, ingredients, misc.",
                "Summary cards show monthly income, expense, and profit.",
                "Delete entries if entered by mistake (managers only).",
              ]}
            />
            <p>
              This is a demo ledger — connect a payment provider in a future release for
              automatic sales sync.
            </p>
          </DocSection>

          <DocSection id="team" title="Team & invites" icon="team">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/team" label="Team" />.
            </p>
            <p>
              <strong className="text-foreground">Who:</strong> Admins and owners only. Access is
              invite-only — no public signup to your organization.
            </p>
            <StepList
              items={[
                "Enter email and pick a role: Staff, Manager, or Admin.",
                "Owner is not invitable — it is assigned automatically when someone creates the organization.",
                "Send invite — copy the invite link and share it with the person.",
                "They sign up (or log in) and accept the invite at /invite/token.",
                "Remove members or revoke pending invites when someone leaves.",
                "Assign outlet access when inviting (staff/managers see only assigned outlets).",
              ]}
            />
            <p>
              Plan limits cap team size — Free: 3 members, Pro: 25, Business: unlimited.
            </p>
          </DocSection>

          <DocSection id="notifications" title="Notifications" icon="bell">
            <p>
              <strong className="text-foreground">Where:</strong> Bell icon in the top bar →{" "}
              <FeatureLink href="/dashboard/notifications" label="Notifications" /> page.
            </p>
            <p>You receive alerts for:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Low stock — ingredient below reorder level at an outlet</li>
              <li>Overdue checklists — runs past due date not yet completed</li>
              <li>Maintenance reminders — scheduled checklist due dates</li>
            </ul>
            <p>
              Mark individual notifications read, mark all read, or clear them. Notifications are
              personal to your account.
            </p>
          </DocSection>

          <DocSection id="settings" title="Settings" icon="settings">
            <p>
              <strong className="text-foreground">Where:</strong>{" "}
              <FeatureLink href="/dashboard/settings" label="Settings" />.
            </p>
            <p>
              <strong className="text-foreground">Organizations:</strong> Switch between
              restaurant groups, create new ones, or delete (owner only).
            </p>
            <p>
              <strong className="text-foreground">Pricing:</strong> This initial release is
              completely free — unlimited outlets, staff, menus, and checklists. No payment,
              packs, or upgrades.
            </p>
          </DocSection>

          <DocSection id="tips" title="Tips & daily workflows" icon="sparkle">
            <p>
              <strong className="text-foreground">Opening shift:</strong> Check low-stock
              notifications → run opening checklist → review table board → confirm menu
              availability.
            </p>
            <p>
              <strong className="text-foreground">During service:</strong> Staff seat tables and
              add orders from the menu → managers watch stock if items sell out → update menu
              availability if needed.
            </p>
            <p>
              <strong className="text-foreground">Closing shift:</strong> Free all tables →
              complete closing checklist → log daily sales and expenses in Finance.
            </p>
            <p>
              <strong className="text-foreground">Multi-outlet groups:</strong> Switch outlet in
              the top bar before editing that location. Org-wide checklists can target a specific
              outlet or apply to all.
            </p>
            <p className="text-xs pt-2 border-t border-border/40">
              Need help? Your role and permissions are shown under Settings → Your role. Refer
              back to this page anytime from the Docs tab in the navigation bar.
            </p>
          </DocSection>
        </div>
      </div>
    </div>
  );
}
