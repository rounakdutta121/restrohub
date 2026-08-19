import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { MarketingJsonLd } from "./json-ld";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingJsonLd />
      <SiteHeader />
      <main className="flex-1" id="main-content">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
