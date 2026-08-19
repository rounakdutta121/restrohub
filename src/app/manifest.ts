import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Restaurant Management Software`,
    short_name: SITE_NAME,
    description:
      "QR menus, kitchen inventory, table orders, and restaurant operations in one platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8eb",
    theme_color: "#c41e3a",
    categories: ["food", "business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
