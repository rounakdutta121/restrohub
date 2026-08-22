import type { Metadata } from "next";
import { getAppUrl } from "./env";

export const SITE_NAME = "RestoHub";
export const SITE_TAGLINE = "Free Restaurant Management Software & QR Menus";
export const SITE_LOCALE = "en_IN";
/** Set when you have a real X/Twitter handle; omit fake handles from cards */
export const TWITTER_HANDLE: string | undefined = undefined;

/** High-intent keywords from restaurant SaaS / F&B ops search demand (India + global) */
export const RESTAURANT_KEYWORDS = [
  // Core product
  "restaurant management software",
  "free restaurant management software",
  "restaurant operations software",
  "restaurant operations platform",
  "restaurant SaaS India",
  "F&B management software",
  "food service management software",
  "hospitality management software",
  // Menus / QR
  "QR code menu for restaurant",
  "QR digital menu India",
  "restaurant QR menu generator",
  "digital food menu",
  "contactless restaurant menu",
  "online menu for cafe",
  // Multi-outlet
  "multi outlet restaurant software",
  "multi location restaurant management",
  "chain restaurant management software",
  // Inventory
  "restaurant inventory management software",
  "kitchen stock management",
  "restaurant low stock alerts",
  "ingredient tracking restaurant",
  // Tables / orders
  "restaurant table management system",
  "table order management restaurant",
  "dine in order management",
  // Kitchen ops
  "restaurant checklist software",
  "kitchen prep checklist app",
  "restaurant SOP software",
  // Team / finance
  "restaurant staff management software",
  "restaurant finance tracking",
  "restaurant expense tracker",
  "restaurant analytics dashboard",
  // Segment
  "cafe management software",
  "cloud kitchen management software",
  "dhaba management software",
  "Indian restaurant software",
  "INR restaurant software",
  "restaurant software for small business",
] as const;

export const PAGE_KEYWORDS = {
  home: [
    "best free restaurant software 2026",
    "restaurant management app free",
    "live kitchen board software",
    "multi device restaurant sync",
    "all in one restaurant software",
    "food business software India",
  ],
  services: [
    "restaurant QR menu service",
    "live kitchen display system",
    "restaurant table order system",
    "kitchen inventory software",
    "food service checklist app",
    "multi location restaurant tools",
    "restaurant stock alert system",
    "F&B finance software",
  ],
  about: [
    "restaurant software company India",
    "about RestoHub",
    "live restaurant operations platform",
    "trusted restaurant management software",
    "kitchen operations software India",
  ],
  privacy: [
    "restaurant software privacy policy",
    "food business data protection",
    "restaurant SaaS GDPR",
    "restaurant data security",
  ],
  signup: [
    "free restaurant software signup",
    "create restaurant management account",
    "QR menu free account",
    "start free restaurant software",
  ],
  login: [
    "RestoHub login",
    "restaurant dashboard login",
  ],
  menu: [
    "restaurant digital menu",
    "scan QR food menu",
    "outlet food menu online",
    "cafe menu QR code",
  ],
} as const;

export function getSiteUrl(): string {
  return getAppUrl();
}

const defaultOgImage = "/images/resto-hero.png";

function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = getSiteUrl().replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function uniqueKeywords(...lists: (readonly string[] | string[])[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const kw of list) {
      const key = kw.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(kw.trim());
    }
  }
  return out;
}

type PageSeoOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  /** Prefer "website" for marketing; "article" for long-form */
  ogType?: "website" | "article";
  noIndex?: boolean;
};

/**
 * Full public-page SEO: canonical, robots, keywords, Open Graph (FB/LinkedIn/IG), Twitter.
 * Instagram and LinkedIn primarily read Open Graph tags.
 */
export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage = defaultOgImage,
  ogType = "website",
  noIndex = false,
}: PageSeoOptions): Metadata {
  const canonical = absoluteUrl(path === "/" ? "/" : path);
  const imageUrl = absoluteUrl(ogImage);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const allKeywords = uniqueKeywords(RESTAURANT_KEYWORDS, keywords);

  return {
    title,
    description,
    keywords: allKeywords,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: getSiteUrl() }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "Food & Drink",
    alternates: { canonical },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false, noimageindex: true },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: ogType,
      locale: SITE_LOCALE,
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      ...(TWITTER_HANDLE ? { site: TWITTER_HANDLE, creator: TWITTER_HANDLE } : {}),
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    // Extra share / crawler hints (IG/FB/LinkedIn lean on OG; these help consistency)
    other: {
      "og:image:alt": `${SITE_NAME} — ${SITE_TAGLINE}`,
      "instagram:title": fullTitle,
      "instagram:description": description,
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      "https://restohubpartner.vercel.app"
  ),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "RestoHub is free restaurant management software for multi-outlet food businesses — QR digital menus, kitchen inventory, table orders, prep checklists, staff roles, analytics, and finance. Built for restaurants, cafes, dhabas, and cloud kitchens in India and worldwide.",
  keywords: uniqueKeywords(RESTAURANT_KEYWORDS, PAGE_KEYWORDS.home),
  authors: [{ name: SITE_NAME, url: "https://restohubpartner.vercel.app" }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Food & Drink",
  formatDetection: { telephone: true, email: true, address: true },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: "https://restohubpartner.vercel.app",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Run every outlet from one hub — free QR menus, stock alerts, table orders, kitchen checklists, finance & analytics for restaurants.",
    images: [
      {
        url: "/images/resto-hero.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} restaurant management software`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    ...(TWITTER_HANDLE ? { site: TWITTER_HANDLE, creator: TWITTER_HANDLE } : {}),
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Free restaurant management software with QR menus, inventory, tables, team roles & analytics.",
    images: ["/images/resto-hero.png"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon" }],
  },
  manifest: "/manifest.webmanifest",
  // Google Search Console: HTML file at /googlef2024d0ddf99fba6.html
  other: {
    "instagram:title": `${SITE_NAME} — ${SITE_TAGLINE}`,
    "instagram:description":
      "Free restaurant ops hub — QR menus, stock, tables, checklists & finance.",
  },
};

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url,
    logo: `${url}/icon.svg`,
    description:
      "Free restaurant management software for QR menus, multi-outlet operations, kitchen inventory, table orders, and food service teams.",
    email: "rounak153d@gmail.com",
    telephone: "+919815121578",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "rounak153d@gmail.com",
      telephone: "+919815121578",
      availableLanguage: ["English", "Hindi"],
      areaServed: ["IN", "Worldwide"],
    },
    sameAs: ["https://panelverse.onrender.com"],
  };
}

export function softwareApplicationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Restaurant Management Software",
    operatingSystem: "Web",
    description:
      "All-in-one free restaurant operations: digital QR menus, inventory & stock alerts, table seating and orders, prep checklists, finance ledger, analytics, and role-based staff access.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      description: "Free during initial release — unlimited outlets, staff, and menus",
      availability: "https://schema.org/InStock",
      url: `${url}/signup`,
    },
    featureList: [
      "Multi-outlet restaurant management",
      "QR code digital menus",
      "Kitchen inventory tracking",
      "Table allocation and paid orders",
      "Prep and maintenance checklists",
      "Restaurant finance and analytics",
      "Staff roles and invites",
    ],
  };
}

export function webSiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    description: SITE_TAGLINE,
    inLanguage: "en-IN",
    publisher: { "@type": "Organization", name: SITE_NAME, url },
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/services?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const HOME_FAQS = [
  {
    question: "What is RestoHub restaurant management software?",
    answer:
      "RestoHub is a free all-in-one restaurant operations platform for multi-outlet food businesses. It includes a live kitchen board, multi-device floor sync, QR digital menus, inventory alerts, table seating and orders, prep checklists, staff roles, finance, and analytics — built for restaurants, cafes, dhabas, and cloud kitchens.",
  },
  {
    question: "Does the kitchen board update live?",
    answer:
      "Yes. When floor staff seat a table or add items, tickets appear on the kitchen board within a few seconds while the tab is open — no full page reload. Status moves pending → preparing → ready on a kitchen tablet.",
  },
  {
    question: "Can multiple devices stay in sync?",
    answer:
      "Yes. Phones, POS tablets, and kitchen screens on the same outlet share one live pulse for tables, kitchen, inventory, finance, and alerts — so the floor and pass stay aligned.",
  },
  {
    question: "Who receives notifications?",
    answer:
      "Alerts follow role hierarchy: staff get new kitchen orders, managers get low-stock and paid-check alerts, and checklist assignees get due reminders. The bell updates live without a reload.",
  },
  {
    question: "Is RestoHub free for restaurants?",
    answer:
      "Yes. This release is completely free — unlimited outlets, staff, menus, checklists, kitchen board, and live sync. No payment, packs, or upgrades required.",
  },
  {
    question: "Does RestoHub work for Indian restaurants with INR pricing?",
    answer:
      "Yes. Outlets can use INR and other currencies. Amounts display with proper local formatting (for example ₹ for INR) on menus, finance ledgers, and table orders.",
  },
] as const;
