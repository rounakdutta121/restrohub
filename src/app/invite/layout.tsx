import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Team Invite",
  description: "Accept your RestoHub restaurant team invitation.",
  path: "/invite",
  noIndex: true,
});

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
