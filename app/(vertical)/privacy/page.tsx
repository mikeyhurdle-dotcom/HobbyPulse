import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import type { Metadata } from "next";

const brand = getSiteBrand();

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${brand.siteName} — how we collect, use, and protect your data.`,
};

export default function PrivacyPage() {
  const config = getSiteVertical();
  const brandInfo = getSiteBrand();

  return (
    <>
      <Nav active="" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: 2 April 2026</p>

        <div className="space-y-8 text-muted-foreground">
          {/* Intro */}
          <section>
            <p>
              {brandInfo.siteName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
              operated by Mikey Hurdle as a personal project. We are committed to protecting your
              privacy and handling your data in accordance with the UK General Data Protection
              Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
            <p className="mt-3">
              This policy applies to {brandInfo.siteName} ({brandInfo.domain}) and explains what
              data we collect, why, and your rights.
            </p>
          </section>

          {/* Data Controller */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Controller</h2>
            <p>
              The data controller is Mikey Hurdle. For any privacy-related questions or requests,
              contact: <span className="text-foreground">privacy@{brandInfo.domain}</span>
            </p>
          </section>

          {/* What We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">What We Collect</h2>

            <h3 className="font-semibold text-foreground mt-4 mb-2">Data you provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Price alert subscriptions:</strong> If you set a price alert, we store your
                email address, the product you selected, and your target price. This is used solely
                to notify you when the price drops below your target.
              </li>
            </ul>

            <h3 className="font-semibold text-foreground mt-4 mb-2">Data collected automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Usage analytics:</strong> We use Google Analytics (GA4) to understand how
                visitors use the site. This collects anonymised data such as pages visited, time on
                site, device type, and referral source. IP addresses are anonymised.
              </li>
              <li>
                <strong>Advertising data:</strong> Google AdSense serves display advertisements on
                this site. Google may use cookies and tracking technologies to serve ads based on
                your interests and browsing history. See{" "}
                <a
                  href="https://policies.google.com/technologies/ads"
                  className="text-[var(--vertical-accent)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google&apos;s advertising policies
                </a>{" "}
                for details.
              </li>
              <li>
                <strong>Server logs:</strong> Our hosting provider (Vercel) may collect standard
                server logs including IP addresses, browser type, and request timestamps. These are
                retained for security and operational purposes.
              </li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
            <p className="mb-3">We use the following types of cookies:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 text-foreground">Type</th>
                    <th className="text-left p-3 text-foreground">Provider</th>
                    <th className="text-left p-3 text-foreground">Purpose</th>
                    <th className="text-left p-3 text-foreground">Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-3">Essential</td>
                    <td className="p-3">{brandInfo.siteName}</td>
                    <td className="p-3">Theme preference (light/dark mode), consent choice</td>
                    <td className="p-3">Yes</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Analytics</td>
                    <td className="p-3">Google Analytics</td>
                    <td className="p-3">Anonymised usage statistics</td>
                    <td className="p-3">No</td>
                  </tr>
                  <tr>
                    <td className="p-3">Advertising</td>
                    <td className="p-3">Google AdSense</td>
                    <td className="p-3">Personalised ad delivery and measurement</td>
                    <td className="p-3">No</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">
              When you first visit the site, a consent banner allows you to accept or reject
              non-essential cookies. You can change your preference at any time by clearing your
              browser cookies and revisiting the site.
            </p>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Legal Basis for Processing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Consent:</strong> Analytics and advertising cookies are only set after you
                consent via the cookie banner (UK GDPR Article 6(1)(a)).
              </li>
              <li>
                <strong>Legitimate interest:</strong> Essential cookies and server logs for site
                functionality and security (UK GDPR Article 6(1)(f)).
              </li>
              <li>
                <strong>Contract:</strong> Processing your email for price alert notifications you
                requested (UK GDPR Article 6(1)(b)).
              </li>
            </ul>
          </section>

          {/* Affiliate Links */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Affiliate Links</h2>
            <p>
              {brandInfo.siteName} contains affiliate links to retailers including{" "}
              {config.retailers.map((r) => r.name).join(", ")}. When you click an outbound link
              and make a purchase, we may earn a small commission at no extra cost to you.
              Affiliate links include UTM tracking parameters for our internal analytics only.
            </p>
          </section>

          {/* Third Parties */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Third-Party Services</h2>
            <p className="mb-3">We share data with the following services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google AdSense</strong> — display advertising (may set cookies for ad personalisation)</li>
              <li><strong>Google Analytics (GA4)</strong> — anonymised usage analytics</li>
              <li><strong>Resend</strong> — transactional emails for price alerts</li>
              <li><strong>Vercel</strong> — hosting and content delivery</li>
              <li><strong>Supabase</strong> — database hosting (EU region, London)</li>
            </ul>
            <p className="mt-3">
              We do not sell, trade, or share your personal data with any other third parties.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Price alert emails:</strong> Retained until you unsubscribe or request deletion.</li>
              <li><strong>Analytics data:</strong> Google Analytics retains data for 14 months by default.</li>
              <li><strong>Server logs:</strong> Retained by Vercel for up to 30 days.</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
            <p className="mb-3">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Rectification</strong> — request correction of inaccurate data</li>
              <li><strong>Erasure</strong> — request deletion of your data (&ldquo;right to be forgotten&rdquo;)</li>
              <li><strong>Restrict processing</strong> — request we limit how we use your data</li>
              <li><strong>Data portability</strong> — request your data in a machine-readable format</li>
              <li><strong>Object</strong> — object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent</strong> — withdraw consent for analytics/advertising cookies at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <span className="text-foreground">privacy@{brandInfo.domain}</span>. We will
              respond within 30 days.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Children&apos;s Privacy</h2>
            <p>
              {brandInfo.siteName} is not directed at children under 13. We do not knowingly
              collect personal data from children. If you believe we have collected data from a
              child, please contact us immediately.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at
              the top of this page indicates when it was last revised. Continued use of the site
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
            <p>
              For any privacy-related questions or data requests, email:{" "}
              <span className="text-foreground">privacy@{brandInfo.domain}</span>
            </p>
            <p className="mt-2">
              If you are not satisfied with our response, you have the right to lodge a complaint
              with the{" "}
              <a
                href="https://ico.org.uk/make-a-complaint/"
                className="text-[var(--vertical-accent)] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Information Commissioner&apos;s Office (ICO)
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
