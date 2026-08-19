import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign In — Restaurant Dashboard",
  description:
    "Sign in to RestoHub to manage your restaurant outlets, QR food menus, kitchen inventory, table orders, and team operations.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
