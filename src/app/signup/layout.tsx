import { Suspense } from "react";
import { createPageMetadata, PAGE_KEYWORDS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Start Free — Restaurant Management Sign Up",
  description:
    "Create your free RestoHub account for restaurant QR menus, multi-outlet management, kitchen stock tracking, table orders, checklists, finance & analytics. No card required.",
  path: "/signup",
  keywords: [...PAGE_KEYWORDS.signup],
  ogImage: "/images/resto-hero.png",
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
