import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { Mail, MessageCircle, ShieldCheck, TrendingDown } from "lucide-react";

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const title = "Contact";
  const description = `Get in touch with ${brand.siteName} — press enquiries, partnership requests, data corrections, and feedback.`;
  const url = `https://${brand.domain}/contact`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${brand.siteName}`,
      description,
      url,
      siteName: brand.siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.siteName}`,
      description,
    },
  };
}

export default function ContactPage() {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const email = `hello@${brand.domain}`;
  const url = `https://${brand.domain}/contact`;

  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${brand.siteName}`,
    url,
    mainEntity: {
      "@type": "Organization",
      name: brand.siteName,
      url: `https://${brand.domain}`,
      email,
    },
  };

  const isSimRacing = config.slug === "simracing";

  return (
    <>
      <JsonLd data={contactLd} />
      <Nav active="" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Contact {brand.siteName}
        </h1>
        <p className="text-muted-foreground mb-10">
          We read every message. Expect a reply within a few days.
        </p>

        {/* Primary contact method */}
        <section className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: "var(--vertical-accent)", opacity: 0.15 }}
            >
              <Mail className="w-5 h-5 text-[var(--vertical-accent)]" />
            </div>
            <h2 className="text-lg font-bold">Email</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The fastest way to reach us. For press, partnerships, bug reports,
            feature suggestions, or data corrections.
          </p>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`${brand.siteName} enquiry`)}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--vertical-accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            {email}
          </a>
        </section>

        {/* What to contact us about */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4">What we can help with</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-[var(--danger)]" />
                <h3 className="font-semibold">Incorrect deal or price</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Spotted a wrong price, broken link, or an out-of-stock item still
                showing as available? Tell us and we&apos;ll fix it fast.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-[var(--vertical-accent)]" />
                <h3 className="font-semibold">Channel or creator requests</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isSimRacing
                  ? "Know a sim racing creator we should track? Send us the channel URL."
                  : "Know a tabletop creator we should track? Send us the channel URL."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
                <h3 className="font-semibold">Press & partnerships</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Retailers, affiliate programs, journalists, and creators — we&apos;d
                love to hear from you.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Data removal / DMCA</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We only index publicly available content. If you&apos;re a rights
                holder and want something removed, email us and we&apos;ll action
                it immediately.
              </p>
            </div>
          </div>
        </section>

        {/* About the operator (AdSense trust signal) */}
        <section className="mb-8 rounded-xl border border-border bg-secondary/30 p-5">
          <h2 className="text-base font-bold mb-2">Who runs {brand.siteName}?</h2>
          <p className="text-sm text-muted-foreground">
            {brand.siteName} is operated by Mikey Hurdle as an independent
            side project. It&apos;s a labour of love built by and for hobbyists.
            Every page you see is generated from public data sources —
            YouTube, Twitch, and retailer catalogues — and curated with care.
          </p>
        </section>

        {/* Before you write */}
        <section>
          <h2 className="text-lg font-bold mb-3">Before you write</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-[var(--vertical-accent)]">→</span>
              Check the{" "}
              <Link
                href="/faq"
                className="text-[var(--vertical-accent-light)] hover:underline"
              >
                FAQ
              </Link>{" "}
              — the most common questions are already answered there.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--vertical-accent)]">→</span>
              For price alerts, use the form on any product page — that&apos;s
              the fastest route.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--vertical-accent)]">→</span>
              Missing content? It may not be parsed yet. Content is ingested
              daily and parsed through AI within a few hours.
            </li>
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
