import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { AdBetweenContent } from "@/components/ad-slot";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import {
  getKickstarterByStatus,
  formatMoney,
  formatPercent,
  daysLeft,
  type KickstarterRow,
} from "@/lib/kickstarter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Clock, TrendingUp, CheckCircle } from "lucide-react";

export const revalidate = 1800; // refresh every 30 min — cron runs every 3h

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const url = `https://${brand.domain}/kickstarter`;
  const title = "Kickstarter Tracker";
  const description = "Live board game crowdfunding — what's funding now, what's ending soon, and recently-funded projects with late-pledge windows still open.";
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
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
  };
}

function ProjectCard({ project }: { project: KickstarterRow }) {
  const days = daysLeft(project.ends_at);
  const detailHref = `/kickstarter/${project.slug}`;

  return (
    <Link href={detailHref} className="group">
      <Card className="overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
        {project.image_url && (
          <div className="relative aspect-video bg-muted overflow-hidden">
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {project.funded_percent != null && (
              <Badge
                className="absolute top-2 left-2 text-[10px] border-0"
                style={{
                  backgroundColor: project.funded_percent >= 100 ? "var(--success)" : "var(--vertical-accent)",
                  color: "#fff",
                }}
              >
                {formatPercent(project.funded_percent)} funded
              </Badge>
            )}
            {days != null && project.status !== "recently_funded" && (
              <Badge className="absolute top-2 right-2 text-[10px] border-0 bg-black/75 text-white">
                {days === 0 ? "Final hours" : days === 1 ? "1 day left" : `${days} days left`}
              </Badge>
            )}
          </div>
        )}
        <CardContent className="p-4 space-y-2">
          <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
            {project.title}
          </h3>
          {project.creator && (
            <p className="text-xs text-muted-foreground truncate">by {project.creator}</p>
          )}
          <div className="flex items-baseline gap-3 text-sm">
            <span className="font-bold text-foreground font-[family-name:var(--font-mono)]">
              {formatMoney(project.funded_amount, project.currency)}
            </span>
            {project.goal_amount && (
              <span className="text-xs text-muted-foreground">
                of {formatMoney(project.goal_amount, project.currency)}
              </span>
            )}
            {project.backers != null && (
              <span className="text-xs text-muted-foreground ml-auto">
                {project.backers.toLocaleString()} backers
              </span>
            )}
          </div>
          {project.blurb && (
            <p className="text-xs text-muted-foreground line-clamp-2">{project.blurb}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function Section({
  title,
  icon: Icon,
  empty,
  projects,
}: {
  title: string;
  icon: typeof Clock;
  empty: string;
  projects: KickstarterRow[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-[var(--vertical-accent)]" />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
        <span className="text-sm text-muted-foreground">{projects.length}</span>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function KickstarterIndexPage() {
  const config = getSiteVertical();
  if (config.slug !== "tabletop") redirect("/");

  const [endingSoon, live, recentlyFunded] = await Promise.all([
    getKickstarterByStatus("ending_soon", 12),
    getKickstarterByStatus("live", 12),
    getKickstarterByStatus("recently_funded", 12),
  ]);

  return (
    <>
      <Nav active="kickstarter" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[var(--vertical-accent)]">
            <Rocket className="w-4 h-4" />
            <span className="font-semibold tracking-wide uppercase text-xs">New</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kickstarter Tracker</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Board game crowdfunding worth watching — live campaigns, the ones ending soon, and
            recently-funded projects with late-pledge windows. Refreshed every few hours.
          </p>
        </header>

        <Section
          title="Ending soon"
          icon={Clock}
          empty="Nothing ending in the next few days."
          projects={endingSoon}
        />

        <AdBetweenContent />

        <Section
          title="Funding now"
          icon={TrendingUp}
          empty="No active campaigns tracked yet — the next sync should bring some in."
          projects={live}
        />

        <Section
          title="Recently funded"
          icon={CheckCircle}
          empty="Nothing closed in the last week."
          projects={recentlyFunded}
        />
      </main>
    </>
  );
}
