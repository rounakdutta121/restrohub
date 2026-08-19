import Link from "next/link";
import { RestoIcon } from "./icons";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md group-hover:scale-105 transition-transform">
        <RestoIcon name="brand" className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="resto-heading text-xl font-bold tracking-tight">
        Resto<span className="text-primary">Hub</span>
      </span>
    </Link>
  );
}

export function LogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { box: "h-7 w-7", icon: "h-3.5 w-3.5" },
    md: { box: "h-9 w-9", icon: "h-5 w-5" },
    lg: { box: "h-12 w-12", icon: "h-6 w-6" },
  }[size];

  return (
    <span
      className={`flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md ${sizes.box}`}
    >
      <RestoIcon name="brand" className={sizes.icon} strokeWidth={2.25} />
    </span>
  );
}
