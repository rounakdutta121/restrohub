import type { Metadata } from "next";
import { getAppUrl } from "./env";

export const SITE_NAME = "RestoHub";
export const SITE_TAGLINE = "Restaurant Management Software & QR Menus";

/** Core restaurant, food & hospitality keywords for public SEO */
export const RESTAURANT_KEYWORDS = [
  "restaurant management software",
  "restaurant operations platform",
  "food service management",
  "restaurant POS software",
  "QR code menu restaurant",
  "digital menu QR code",
  "multi outlet restaurant management",
  "restaurant inventory management",
  "kitchen stock management",
  "restaurant checklist software",
  "table management restaurant",
  "restaurant staff management",
  "food and beverage operations",
  "F&B management software",
  "restaurant SaaS",
  "cloud kitchen management",
  "cafe management software",
  "dhaba management system",
  "Indian restaurant software",
  "restaurant finance tracking",
  "menu management system",
  "restaurant ERP",
  "hospitality management software",
  "restaurant booking and tables",
  "prep checklist kitchen",
  "low stock alerts restaurant",
  "restaurant team invites",
  "INR restaurant billing",
] as const;

export function getSiteUrl(): string {
  return getAppUrl();
}

const defaultOgImage = "/images/resto-hero.png";

type PageSeoOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage = defaultOgImage,
  noIndex = false,
}: PageSeoOptions): Metadata {
  const url = `${getSiteUrl()}${path}`;
  const allKeywords = [...RESTAURANT_KEYWORDS, ...keywords];

  return {
    title,
    description,
    keywords: allKeywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "RestoHub is restaurant management software for multi-outlet food businesses — QR digital menus, kitchen inventory, table orders, prep checklists, staff roles, and finance in one platform. Built for restaurants, cafes, dhabas, and cloud kitchens in India and worldwide.",
  keywords: [...RESTAURANT_KEYWORDS],
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Food & Drink",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description:
      "Run every outlet from one hub — QR menus, stock alerts, table orders, kitchen checklists, and restaurant finance.",
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: "Restaurant management software with QR menus, inventory, tables & team roles.",
    images: [defaultOgImage],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: `${getSiteUrl()}/icon.svg`,
    description:
      "Restaurant management software for QR menus, multi-outlet operations, kitchen inventory, and food service teams.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "rounak153d@gmail.com",
      telephone: "+919815121578",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [],
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Restaurant Management Software",
    operatingSystem: "Web",
    description:
      "All-in-one restaurant operations: digital QR menus, inventory & stock alerts, table seating and orders, prep checklists, finance ledger, and role-based staff access.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan with 1 outlet and QR menu",
    },
    featureList: [
      "Multi-outlet restaurant management",
      "QR code digital menus",
      "Kitchen inventory tracking",
      "Table allocation and orders",
      "Prep and maintenance checklists",
      "Restaurant finance ledger",
      "Staff roles and invites",
    ],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: SITE_TAGLINE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/services?q={search_term_string}`,
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
      item: `${getSiteUrl()}${item.path}`,
    })),
  };
}

export const HOME_FAQS = [
  {
    question: "What is RestoHub restaurant management software?",
    answer:
      "RestoHub is an all-in-one restaurant operations platform for multi-outlet food businesses. It includes QR digital menus, kitchen inventory tracking, table seating and orders, prep checklists, staff role management, and per-outlet finance — built for restaurants, cafes, dhabas, and cloud kitchens.",
  },
  {
    question: "Does RestoHub support QR code menus for restaurants?",
    answer:
      "Yes. Each outlet gets a public mobile-friendly food menu page and a downloadable QR code. When you update menu items or prices, guests see changes instantly without reprinting menus.",
  },
  {
    question: "Can I manage multiple restaurant outlets in one account?",
    answer:
      "Yes. RestoHub supports multi-outlet organizations with a single team, invite system, and dashboard. Switch between locations in one click while keeping stock, menus, tables, and finance scoped per outlet.",
  },
  {
    question: "Is RestoHub free for restaurants?",
    answer:
      "RestoHub offers a free plan with one outlet and QR menu access. Pro and Business plans add more outlets, team members, and advanced features — upgrade anytime from Settings.",
  },
  {
    question: "Does RestoHub work for Indian restaurants with INR pricing?",
    answer:
      "Yes. Outlets can use INR and other currencies. Amounts display with proper local formatting (for example ₹ for INR) on menus, finance ledgers, and table orders.",
  },
] as const;
