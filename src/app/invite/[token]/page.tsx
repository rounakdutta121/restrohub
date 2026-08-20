"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RestoLoader } from "@/components/ui/resto-loader";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

type InviteInfo = {
  email: string;
  role: string;
  workspace: { id: string; name: string };
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || "Invalid invite");
          return;
        }
        setInvite(d);
      })
      .catch(() => setError("Could not load invite"));
  }, [token]);

  async function accept() {
    setLoading(true);
    const res = await fetch(`/api/invites/${token}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || "Could not accept invite");
      return;
    }
    if (data.workspaceId) {
      localStorage.setItem("activeOrgId", data.workspaceId);
    }
    toast.success(data.alreadyMember ? "You’re already on this team" : "Welcome to the team!");
    router.push("/dashboard");
    router.refresh();
  }

  if (!invite && !error) {
    return (
      <div className="min-h-screen menu-gradient flex items-center justify-center px-4">
        <div className="resto-card p-8 max-w-md text-center">
          <RestoLoader message="Reading your invite..." />
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen resto-pattern flex items-center justify-center px-4">
        <div className="resto-card p-8 max-w-md text-center space-y-4">
          <h1 className="resto-heading text-xl font-bold text-[var(--restaurant-brown)]">Invite unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link href="/login">
            <Button className="rounded-full">Go to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const emailMismatch =
    status === "authenticated" &&
    session?.user?.email &&
    session.user.email.toLowerCase() !== invite.email.toLowerCase();

  return (
    <div className="min-h-screen resto-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="resto-card p-0 overflow-hidden shadow-2xl">
          <div className="relative h-36">
            <Image src="/images/resto-kitchen.png" alt="Join the team" fill className="object-cover" sizes="400px" />
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
            <p className="text-xs text-muted-foreground">
              This invite is for <strong>{invite.email}</strong>
            </p>

            {status === "authenticated" ? (
              emailMismatch ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                    You’re signed in as <strong>{session?.user?.email}</strong>. Sign out and use{" "}
                    <strong>{invite.email}</strong> to accept.
                  </p>
                  <Link href={`/login?callbackUrl=/invite/${token}`}>
                    <Button className="w-full rounded-full" variant="outline">
                      Switch account
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button className="w-full rounded-full h-11" onClick={accept} disabled={loading}>
                  {loading ? "Joining..." : "Accept invite"}
                </Button>
              )
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Sign in or create an account with <strong>{invite.email}</strong> to accept.
                </p>
                <Link href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
                  <Button className="w-full rounded-full" variant="outline">
                    Log in
                  </Button>
                </Link>
                <Link href={`/signup?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
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
