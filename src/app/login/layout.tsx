import { Suspense } from "react";
import { createPageMetadata, PAGE_KEYWORDS } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign In to Your Restaurant Dashboard",
  description:
    "Sign in to RestoHub to manage restaurant outlets, QR food menus, kitchen inventory, table orders, finance, analytics, and team operations.",
  path: "/login",
  keywords: [...PAGE_KEYWORDS.login],
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
