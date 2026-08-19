"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RestoLoader } from "@/components/ui/resto-loader";
import { RestoIcon } from "@/components/brand/icons";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [invite, setInvite] = useState<{ email: string; role: string; workspace: { name: string } } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) toast.error(d.error);
        else setInvite(d);
      });
  }, [token]);

  async function accept() {
    setLoading(true);
    const res = await fetch(`/api/invites/${token}`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast.success("Welcome to the team!");
      router.push("/dashboard");
    } else {
      const data = await res.json();
      toast.error(data.error);
    }
  }

  if (!invite) {
    return (
      <div className="min-h-screen menu-gradient flex items-center justify-center">
        <RestoLoader message="Reading your invite..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen resto-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="resto-card p-0 overflow-hidden shadow-2xl">
          <div className="relative h-36">
            <Image src="/images/resto-kitchen.png" alt="Join the team" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--restaurant-brown)]/90 to-primary/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 text-white text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm animate-float mb-2">
                <UserPlus className="h-6 w-6 text-[var(--restaurant-yellow)]" />
              </span>
              <h1 className="resto-heading text-2xl font-bold">You&apos;re invited!</h1>
            </div>
          </div>
          <div className="p-8 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Join <strong className="text-[var(--restaurant-brown)]">{invite.workspace.name}</strong> as{" "}
              <strong className="text-primary capitalize">{invite.role}</strong>
            </p>
            <p className="text-xs text-muted-foreground">Invite for: {invite.email}</p>

            {status === "authenticated" ? (
              <Button className="w-full rounded-full h-11" onClick={accept} disabled={loading}>
                {loading ? "Joining..." : "Accept Invite"}
              </Button>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Sign in or create an account to accept.</p>
                <Link href={`/login?callbackUrl=/invite/${token}`}>
                  <Button className="w-full rounded-full" variant="outline">Log in</Button>
                </Link>
                <Link href={`/signup?callbackUrl=/invite/${token}`}>
                  <Button className="w-full rounded-full">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
