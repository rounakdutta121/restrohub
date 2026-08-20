import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { createPageMetadata, PAGE_KEYWORDS } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { slug },
    select: { name: true, city: true, isActive: true },
  });

  if (!outlet || !outlet.isActive) {
    return createPageMetadata({
      title: "Menu not found",
      description: "This restaurant menu link is unavailable.",
      path: `/m/${slug}`,
      keywords: [...PAGE_KEYWORDS.menu],
      noIndex: true,
    });
  }

  const place = outlet.city ? ` in ${outlet.city}` : "";
  return createPageMetadata({
    title: `${outlet.name} Menu — Digital QR Food Menu`,
    description: `View the live digital food menu for ${outlet.name}${place}. Scan the QR code or open this page for prices and dishes — powered by RestoHub.`,
    path: `/m/${slug}`,
    keywords: [
      ...PAGE_KEYWORDS.menu,
      `${outlet.name} menu`,
      `${outlet.name} QR menu`,
      outlet.city ? `${outlet.city} restaurant menu` : "",
    ].filter(Boolean),
    ogImage: "/images/resto-food-spread.png",
  });
}

export default function PublicMenuLayout({ children }: Props) {
  return children;
}
