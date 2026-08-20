import { cn } from "@/lib/utils";

const PANELVERSE_URL = "https://panelverse.onrender.com";

export function DevelopedBy({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  const onDark = variant === "onDark";
  return (
    <p
      className={cn(
        "text-center text-[11px] tracking-wide py-3 px-4",
        onDark ? "text-white/45" : "text-muted-foreground/80",
        className
      )}
    >
      Developed by{" "}
      <a
        href={PANELVERSE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "font-medium underline underline-offset-2 transition-colors",
          onDark
            ? "text-white/70 decoration-white/30 hover:text-[var(--restaurant-yellow)]"
            : "text-muted-foreground decoration-muted-foreground/40 hover:text-foreground hover:decoration-foreground/50"
        )}
      >
        Panelverse
      </a>
    </p>
  );
}
