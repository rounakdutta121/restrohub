import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
  HOME_FAQS,
} from "@/lib/seo";

function JsonLdScript({ id, data }: { id: string; data: Record<string, unknown> }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function MarketingJsonLd() {
  const schemas = [organizationJsonLd(), softwareApplicationJsonLd(), webSiteJsonLd()];

  return (
    <>
      {schemas.map((schema) => (
        <JsonLdScript key={schema["@type"] as string} id={`ld-${schema["@type"]}`} data={schema} />
      ))}
    </>
  );
}

export function HomeFaqJsonLd() {
  return <JsonLdScript id="ld-faq" data={faqJsonLd([...HOME_FAQS])} />;
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return <JsonLdScript id="ld-breadcrumb" data={breadcrumbJsonLd(items)} />;
}
