import { Nav } from "@/components/nav";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import type { Metadata } from "next";

const config = getSiteVertical();
const brand = getSiteBrand();

export const metadata: Metadata = {
  title: `Privacy Policy | ${brand.siteName}`,
};

export default function PrivacyPage() {
  return (
    <>
      <Nav active="" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--foreground)]">
          <p className="text-[var(--muted)]">Last updated: 30 March 2026</p>

          <h2 className="text-xl font-semibold mt-8">What we collect</h2>
          <p>
            {brand.siteName} collects minimal data. We do not require user accounts or login.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-[var(--muted)]">
            <li><strong>Price alerts:</strong> If you subscribe to a price alert, we store your email address and target price. This is used solely to notify you when the price drops.</li>
            <li><strong>Analytics:</strong> We use Google Analytics (GA4) and PostHog to understand how visitors use the site. These tools collect anonymised usage data such as pages visited, time on site, and referral source. No personally identifiable information is collected.</li>
            <li><strong>Cookies:</strong> We use essential cookies for site functionality. Third-party ad providers (Google AdSense) may use cookies for ad personalisation.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">How we use your data</h2>
          <ul className="list-disc pl-6 space-y-2 text-[var(--muted)]">
            <li>Price alert emails are sent via Resend. Your email is not shared with third parties.</li>
            <li>Analytics data helps us improve the site and understand which content is most useful.</li>
            <li>We do not sell, trade, or share personal data with anyone.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">Affiliate links</h2>
          <p className="text-[var(--muted)]">
            {brand.siteName} contains affiliate links to retailers. When you click an outbound link and make a purchase, we may earn a small commission at no extra cost to you. Affiliate links are clearly marked and use UTM tracking parameters for our internal analytics.
          </p>

          <h2 className="text-xl font-semibold mt-8">Third-party services</h2>
          <ul className="list-disc pl-6 space-y-2 text-[var(--muted)]">
            <li><strong>Google AdSense</strong> — display advertising</li>
            <li><strong>Google Analytics (GA4)</strong> — usage analytics</li>
            <li><strong>PostHog</strong> — product analytics</li>
            <li><strong>Resend</strong> — transactional emails</li>
            <li><strong>Vercel</strong> — hosting</li>
            <li><strong>Supabase</strong> — database</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">Your rights</h2>
          <p className="text-[var(--muted)]">
            You can unsubscribe from price alerts at any time by clicking the unsubscribe link in any alert email. For data deletion requests, contact us at the email below.
          </p>

          <h2 className="text-xl font-semibold mt-8">Contact</h2>
          <p className="text-[var(--muted)]">
            For any privacy-related questions, email: privacy@{brand.domain}
          </p>
        </div>
      </main>
    </>
  );
}
