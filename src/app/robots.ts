import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/about", "/privacy", "/signup", "/m/"],
        disallow: ["/dashboard/", "/api/", "/invite/", "/login"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/services", "/about", "/privacy", "/signup", "/m/"],
        disallow: ["/dashboard/", "/api/", "/invite/", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
