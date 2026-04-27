import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { AdSidebar } from "@/components/ad-slot";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import {
  getKickstarterBySlug,
  formatMoney,
  formatPercent,
  daysLeft,
} from "@/lib/kickstarter";
import { wrapAffiliateUrl } from "@/lib/affiliate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Clock, Users, Wallet, ExternalLink } from "lucide-react";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}): Promise<Metadata> {
  const { projectSlug } = await params;
  const project = await getKickstarterBySlug(projectSlug);
  if (!project) return { title: "Project not found" };

  const brand = getSiteBrand();
  return {
    title: `${project.title} — Kickstarter Tracker`,
    description: project.blurb ?? `${project.title} on Kickstarter — funding, days left, and pledge details.`,
    alternates: { canonical: `https://${brand.domain}/kickstarter/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.blurb ?? "",
      images: project.image_url ? [{ url: project.image_url }] : undefined,
    },
  };
}

export default async function KickstarterDetailPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const config = getSiteVertical();
  if (config.slug !== "tabletop") redirect("/");

  const { projectSlug } = await params;
  const project = await getKickstarterBySlug(projectSlug);
  if (!project) notFound();

  const days = daysLeft(project.ends_at);
  const isEnded = project.status === "ended";
  const lateOpen = project.late_pledge_open && project.late_pledge_url;

  const backHref = wrapAffiliateUrl(project.url, "kickstarter-back");
  const lateHref = project.late_pledge_url
    ? wrapAffiliateUrl(project.late_pledge_url, "kickstarter-late")
    : null;

  return (
    <>
      <Nav active="kickstarter" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/kickstarter"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Kickstarter Tracker
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {project.image_url && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted">
                <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {project.funded_percent != null && (
                  <Badge
                    className="border-0 text-xs"
                    style={{
                      backgroundColor: project.funded_percent >= 100 ? "var(--success)" : "var(--vertical-accent)",
                      color: "#fff",
                    }}
                  >
                    {formatPercent(project.funded_percent)} funded
                  </Badge>
                )}
                {!isEnded && days != null && (
                  <Badge className="border-0 text-xs bg-black/75 text-white">
                    <Clock className="w-3 h-3 mr-1" />
                    {days === 0 ? "Final hours" : days === 1 ? "1 day left" : `${days} days left`}
                  </Badge>
                )}
                {isEnded && (
                  <Badge variant="secondary" className="text-xs">
                    Campaign ended
                  </Badge>
                )}
                {lateOpen && (
                  <Badge className="border-0 text-xs bg-[var(--vertical-accent)] text-white">
                    Late pledge open
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                {project.title}
              </h1>
              {project.creator && (
                <p className="text-sm text-muted-foreground">by {project.creator}</p>
              )}
              {project.blurb && (
                <p className="text-base text-muted-foreground leading-relaxed">{project.blurb}</p>
              )}
            </div>

            <Card className="border-border bg-card">
              <CardContent className="p-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <Wallet className="w-3 h-3" />
                    Raised
                  </div>
                  <p className="text-xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                    {formatMoney(project.funded_amount, project.currency)}
                  </p>
                  {project.goal_amount && (
                    <p className="text-[11px] text-muted-foreground">
                      of {formatMoney(project.goal_amount, project.currency)}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <Users className="w-3 h-3" />
                    Backers
                  </div>
                  <p className="text-xl font-bold tracking-tight font-[family-name:var(--font-mono)]">
                    {project.backers?.toLocaleString() ?? "—"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    Status
                  </div>
                  <p className="text-sm font-semibold capitalize">
                    {project.status.replace(/_/g, " ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            {!isEnded && (
              <a
                href={backHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--vertical-accent)] px-4 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Back this on Kickstarter
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            {lateHref && (
              <a
                href={lateHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-[var(--vertical-accent)] bg-background px-4 py-3 text-sm font-semibold text-[var(--vertical-accent)] hover:bg-[var(--vertical-accent-glow)] transition-colors"
              >
                Pledge late on BackerKit
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {isEnded && !lateHref && (
              <a
                href={backHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                View the campaign archive
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">
              Pledge tier details, shipping, and add-ons live on the campaign page.
              We track funding, backers, and timing — for the small print, head to
              the source.
            </p>
            <AdSidebar className="mt-4" />
          </aside>
        </div>
      </main>
    </>
  );
}
