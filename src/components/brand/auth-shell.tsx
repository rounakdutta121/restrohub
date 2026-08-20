import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { RestoIcon, RestoIconBadge } from "./icons";
import { DevelopedBy } from "./developed-by";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen resto-pattern flex flex-col">
      <div className="flex-1 flex min-h-0">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <Image
            src="/images/resto-kitchen.png"
            alt="Restaurant kitchen"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--restaurant-brown)]/90 via-[var(--restaurant-brown)]/50 to-primary/30" />
          <div className="relative z-10 flex flex-col justify-between p-12 h-full text-white">
            <Logo className="text-white [&_span]:text-white [&_.text-primary]:text-[var(--restaurant-yellow)]" />
            <div className="space-y-6 max-w-md animate-fade-in-up">
              <h1 className="resto-heading text-4xl xl:text-5xl font-bold leading-tight">
                Run your restaurants with{" "}
                <span className="text-[var(--restaurant-yellow)]">flavor</span> &amp; precision
              </h1>
              <p className="text-white/85 text-lg">
                Menus, inventory, tables, checklists — everything your kitchen and
                front-of-house need, in one warm &amp; lively hub.
              </p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { icon: "outlets" as const, label: "Multi-outlet" },
                  { icon: "mobile" as const, label: "QR Menus" },
                  { icon: "stock" as const, label: "Stock alerts" },
                ].map((tag) => (
                  <span
                    key={tag.label}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-sm font-medium backdrop-blur-md border border-white/20"
                  >
                    <RestoIcon name={tag.icon} className="h-4 w-4 text-[var(--restaurant-yellow)]" />
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-white/50">Trusted by restaurant owners worldwide</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="lg:hidden mb-8 flex justify-center">
              <Logo />
            </div>
            <div className="resto-card p-8 shadow-xl">
              <div className="text-center mb-6">
                <RestoIconBadge name="brand" size="lg" className="mb-3 bg-primary/10 animate-float" />
                <h2 className="resto-heading text-2xl font-bold">{title}</h2>
                <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
      <DevelopedBy />
    </div>
  );
}
