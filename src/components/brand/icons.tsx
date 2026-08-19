import {
  Armchair,
  BarChart3,
  Bell,
  BookOpen,
  ChefHat,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  Flame,
  Home,
  MapPin,
  Package,
  RotateCw,
  Settings,
  Smartphone,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const restoIcons = {
  home: Home,
  outlets: Store,
  menus: ClipboardList,
  stock: Package,
  prep: ClipboardCheck,
  runs: RotateCw,
  tables: Armchair,
  finance: Wallet,
  team: Users,
  settings: Settings,
  docs: BookOpen,
  brand: UtensilsCrossed,
  bell: Bell,
  mobile: Smartphone,
  location: MapPin,
  sparkle: Sparkles,
  chart: BarChart3,
  income: TrendingUp,
  expense: TrendingDown,
  clock: Clock,
  document: FileText,
  flame: Flame,
  chef: ChefHat,
  maintenance: Wrench,
} satisfies Record<string, LucideIcon>;

export type RestoIconName = keyof typeof restoIcons;

export function RestoIcon({
  name,
  className = "h-5 w-5",
  strokeWidth = 2,
}: {
  name: RestoIconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = restoIcons[name];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

export function RestoIconBadge({
  name,
  size = "md",
  className = "",
}: {
  name: RestoIconName;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: { box: "h-8 w-8", icon: "h-4 w-4" },
    md: { box: "h-10 w-10", icon: "h-5 w-5" },
    lg: { box: "h-12 w-12", icon: "h-6 w-6" },
    xl: { box: "h-16 w-16", icon: "h-8 w-8" },
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary ${sizes.box} ${className}`}
    >
      <RestoIcon name={name} className={sizes.icon} />
    </span>
  );
}
