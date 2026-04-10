import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { supabase } from "@/lib/supabase";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import {
  findChannelBySlug,
  formatSubscribers,
} from "@/lib/channels";
import { ArrowLeft, Users, Video, Eye, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { classifyGameSystem, isShort } from "@/lib/classify";
import { getGameSystem } from "@/config/game-systems";

export const revalidate = 3600;

interface Report {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  view_count: number;
  duration_seconds: number;
}

async function getChannelData(slug: string) {
  const config = getSiteVertical();

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;
  if (!verticalId) return null;

  const channel = await findChannelBySlug(slug, verticalId);
  if (!channel) return null;

  const { data: reports } = await supabase
    .from("battle_reports")
    .select("id, youtube_video_id, title, thumbnail_url, published_at, view_count, duration_seconds")
    .eq("channel_id", channel.id)
    .order("published_at", { ascending: false })
    .limit(200);

  const allVideos = (reports ?? []) as Report[];
  const filtered = allVideos.filter(
    (v) => !isShort(v.duration_seconds) && !v.title.toLowerCase().includes("#shorts"),
  );

  const totalViews = filtered.reduce((acc, r) => acc + (r.view_count ?? 0), 0);

  return { channel, videos: filtered, totalViews };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = getSiteBrand();
  const data = await getChannelData(slug);

  if (!data) {
    return { title: "Channel not found" };
  }

  const { channel, videos } = data;
  const config = getSiteVertical();
  const isSimRacing = config.slug === "simracing";
  const title = `${channel.name} — All ${isSimRacing ? "Race Replays & Setup Guides" : "Battle Reports & Army Lists"}`;
  const description = `${videos.length} ${isSimRacing ? "race replays and setup guides" : "battle reports and army lists"} from ${channel.name} — aggregated, parsed, and cross-referenced with ${brand.siteName} price comparison data.`;
  const url = `https://${brand.domain}/channels/${slug}`;

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
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: channel.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${channel.name} | ${brand.siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getChannelData(slug);
  if (!data) notFound();

  const { channel, videos, totalViews } = data;
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const isSimRacing = config.slug === "simracing";

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: channel.name,
    url: `https://${brand.domain}/channels/${slug}`,
    sameAs: [`https://www.youtube.com/channel/${channel.youtube_channel_id}`],
    ...(channel.thumbnail_url && { image: channel.thumbnail_url }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://${brand.domain}` },
      { "@type": "ListItem", position: 2, name: "Channels", item: `https://${brand.domain}/channels` },
      { "@type": "ListItem", position: 3, name: channel.name, item: `https://${brand.domain}/channels/${slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={personLd} />
      <JsonLd data={breadcrumbLd} />
      <Nav active="" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/channels"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All channels
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
          {channel.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.thumbnail_url}
              alt={channel.name}
              className="w-20 h-20 rounded-full shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted shrink-0" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{channel.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {channel.subscriber_count > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {formatSubscribers(channel.subscriber_count)} subscribers
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                {videos.length} {isSimRacing ? "replays" : "reports"}
              </span>
              {totalViews > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {formatViews(totalViews)} total views
                </span>
              )}
            </div>
          </div>
          <a
            href={`https://www.youtube.com/channel/${channel.youtube_channel_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background hover:bg-secondary px-4 py-2 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            YouTube
          </a>
        </div>

        {/* Intro */}
        <p className="text-muted-foreground mb-8 max-w-3xl">
          All {videos.length} {isSimRacing ? "race replays and setup guides" : "battle reports and army lists"} from {channel.name},
          parsed and cross-referenced with {brand.siteName} price comparison data.
          {isSimRacing
            ? " Click any video to see the extracted car setup."
            : " Click any video to see the extracted army lists."}
        </p>

        {/* Video grid */}
        {videos.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
            No {isSimRacing ? "replays" : "reports"} from this channel yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => {
              const gameSystem = classifyGameSystem(video.title);
              const gs = getGameSystem(gameSystem);
              return (
                <Link
                  key={video.id}
                  href={`/watch/${video.youtube_video_id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-border bg-card hover:border-[var(--vertical-accent)]/40 transition-all">
                    <div className="relative aspect-video bg-muted">
                      {video.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {video.duration_seconds > 0 && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium font-[family-name:var(--font-mono)] bg-black/75 text-white">
                          {formatDuration(video.duration_seconds)}
                        </span>
                      )}
                      {gs && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2 text-[10px]"
                          style={{ backgroundColor: gs.colour, color: "#fff" }}
                        >
                          {gs.shortName}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3.5">
                      <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {video.title}
                      </h3>
                      {video.view_count > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatViews(video.view_count)} views
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
