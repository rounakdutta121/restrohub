/**
 * Public app URL for SEO, invite links, and redirects.
 * Prefer NEXT_PUBLIC_SITE_URL in production (canonical domain).
 */
export function getAppUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromPublic) return fromPublic;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  // Production fallback so OG/canonical stay correct if env is missing at build time
  if (process.env.NODE_ENV === "production") {
    return "https://restohubpartner.vercel.app";
  }
  return "http://localhost:3000";
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
