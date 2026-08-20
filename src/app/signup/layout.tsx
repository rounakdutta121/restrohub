import { Suspense } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Start Free — Restaurant Management Sign Up",
  description:
    "Create your free RestoHub account for restaurant QR menus, multi-outlet management, kitchen stock tracking, table orders, and food service checklists.",
  path: "/signup",
  keywords: [
    "free restaurant software signup",
    "restaurant management free trial",
    "QR menu free account",
  ],
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
