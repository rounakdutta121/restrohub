import { RestoIcon } from "@/components/brand/icons";

export function RestoLoader({ message = "Preparing..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-secondary/30" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-primary animate-pulse">
          <RestoIcon name="brand" className="h-7 w-7" />
        </span>
      </div>
      <p className="resto-heading text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export function RestoPageLoader() {
  return (
    <div className="fixed inset-0 z-[100] menu-gradient flex flex-col items-center justify-center">
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl animate-bounce">
          <RestoIcon name="brand" className="h-10 w-10" strokeWidth={2.25} />
        </div>
        <div className="absolute -inset-4 rounded-3xl border-2 border-[var(--restaurant-mustard)]/40 animate-ping" />
      </div>
      <p className="resto-heading text-xl font-bold text-[var(--restaurant-brown)] mt-8">
        RestoHub
      </p>
      <p className="text-sm text-muted-foreground mt-2 animate-pulse">Warming up the kitchen...</p>
      <div className="flex gap-1 mt-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function RestoSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl animate-shimmer ${className}`} />
  );
}

export function RestoCardSkeleton() {
  return (
    <div className="resto-card p-6 space-y-3">
      <RestoSkeleton className="h-8 w-8 rounded-lg" />
      <RestoSkeleton className="h-4 w-3/4" />
      <RestoSkeleton className="h-3 w-full" />
      <RestoSkeleton className="h-3 w-2/3" />
    </div>
  );
}
