"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/brand/auth-shell";
import { GOOGLE_AUTH_ENABLED } from "@/lib/env";
import { getSafeCallbackUrl } from "@/lib/auth-redirect";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), "/dashboard");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      toast.error("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <AuthShell title="Welcome back, chef!" subtitle="Log in to your RestoHub kitchen command center">
      <div className="space-y-4">
        {GOOGLE_AUTH_ENABLED && (
          <Button
            variant="outline"
            className="w-full rounded-full border-secondary bg-secondary/20 hover:bg-secondary/40"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Continue with Google
          </Button>
        )}

        {GOOGLE_AUTH_ENABLED && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">or email</span>
            </div>
          </div>
        )}

        <form method="post" onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="chef@yourrestaurant.com" className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required placeholder="••••••••" className="rounded-lg" />
          </div>
          <Button type="submit" className="w-full rounded-full h-10" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href={`/signup${searchParams.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="font-semibold text-primary hover:underline"
          >
            Create free account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
