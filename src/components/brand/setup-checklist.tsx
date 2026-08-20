"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RestoIcon, type RestoIconName } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

export type SetupStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
  icon: RestoIconName;
};

export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const remaining = steps.filter((s) => !s.done).length;
  if (remaining === 0) return null;

  return (
    <div className="resto-card p-5 sm:p-6 border border-[var(--restaurant-mustard)]/40 bg-[var(--restaurant-mustard)]/5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="resto-heading text-lg font-bold text-[var(--restaurant-brown)]">
            Get your kitchen ready
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {remaining} step{remaining === 1 ? "" : "s"} left — you&apos;ll be live in minutes.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
          {steps.filter((s) => s.done).length}/{steps.length}
        </span>
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 border",
              step.done
                ? "bg-secondary/20 border-transparent opacity-70"
                : "bg-background border-border/60"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0",
                step.done
                  ? "bg-green-600 text-white"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--restaurant-brown)]">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {!step.done && (
              <Link href={step.href}>
                <Button size="sm" className="rounded-full shrink-0 gap-1">
                  <RestoIcon name={step.icon} className="h-3.5 w-3.5" />
                  Go
                </Button>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
