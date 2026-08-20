import Link from "next/link";
import Image from "next/image";
import { RestoIcon, RestoIconBadge, type RestoIconName } from "./icons";
import { Button } from "@/components/ui/button";

export function RestoPageHeader({
  title,
  subtitle,
  icon = "brand",
  image = "/images/resto-kitchen.png",
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: RestoIconName;
  image?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="resto-card p-0 overflow-hidden animate-fade-in-up">
      <div className="relative h-28 sm:h-32">
        <Image src={image} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--restaurant-brown)]/85 to-[var(--restaurant-brown)]/40" />
        <div className="absolute inset-0 flex items-center justify-between gap-4 px-4 sm:px-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm animate-float">
              <RestoIcon name={icon} className="h-6 w-6 text-[var(--restaurant-yellow)]" />
            </span>
            <div className="min-w-0">
              <h1 className="resto-heading text-xl sm:text-2xl font-bold truncate">{title}</h1>
              {subtitle && <p className="text-white/80 text-sm mt-0.5 line-clamp-2">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0 hidden sm:block">{action}</div>}
        </div>
      </div>
      {action && <div className="sm:hidden p-3 border-t border-border/40 flex justify-end">{action}</div>}
    </div>
  );
}

export function RestoEmptyState({
  icon,
  title,
  description,
  action,
  actionHref,
  actionLabel,
}: {
  icon: RestoIconName;
  title: string;
  description: string;
  action?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  const resolvedAction =
    action ??
    (actionHref && actionLabel ? (
      <Link href={actionHref}>
        <Button className="rounded-full px-6">{actionLabel}</Button>
      </Link>
    ) : null);

  return (
    <div className="resto-card p-10 text-center animate-fade-in-up">
      <RestoIconBadge name={icon} size="xl" className="mx-auto mb-4 animate-float bg-secondary/30" />
      <h3 className="resto-heading text-lg font-bold text-[var(--restaurant-brown)]">{title}</h3>
      <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">{description}</p>
      {resolvedAction && <div className="mt-5 flex justify-center">{resolvedAction}</div>}
    </div>
  );
}
