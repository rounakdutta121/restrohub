import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/about", "/privacy", "/login", "/signup"],
        disallow: ["/dashboard/", "/api/", "/invite/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
