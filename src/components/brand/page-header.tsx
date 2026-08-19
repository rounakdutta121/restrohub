import Image from "next/image";
import { RestoIcon, RestoIconBadge, type RestoIconName } from "./icons";

export function RestoPageHeader({
  title,
  subtitle,
  icon = "brand",
  image = "/images/resto-kitchen.png",
}: {
  title: string;
  subtitle?: string;
  icon?: RestoIconName;
  image?: string;
}) {
  return (
    <div className="resto-card p-0 overflow-hidden animate-fade-in-up">
      <div className="relative h-28 sm:h-32">
        <Image src={image} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--restaurant-brown)]/85 to-[var(--restaurant-brown)]/40" />
        <div className="absolute inset-0 flex items-center gap-4 px-6 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm animate-float">
            <RestoIcon name={icon} className="h-6 w-6 text-[var(--restaurant-yellow)]" />
          </span>
          <div>
            <h1 className="resto-heading text-xl sm:text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-white/80 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RestoEmptyState({
  icon,
  title,
  description,
}: {
  icon: RestoIconName;
  title: string;
  description: string;
}) {
  return (
    <div className="resto-card p-10 text-center animate-fade-in-up">
      <RestoIconBadge name={icon} size="xl" className="mx-auto mb-4 animate-float bg-secondary/30" />
      <h3 className="resto-heading text-lg font-bold text-[var(--restaurant-brown)]">{title}</h3>
      <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
