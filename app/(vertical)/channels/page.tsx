import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { supabase } from "@/lib/supabase";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import {
  getChannelsForVertical,
  channelSlug,
  formatSubscribers,
  type Channel,
} from "@/lib/channels";
import { Users, Video } from "lucide-react";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();
  const config = getSiteVertical();
  const isSimRacing = config.slug === "simracing";
  const title = isSimRacing
    ? "Sim Racing YouTube Channels"
    : "Warhammer YouTube Channels";
  const description = isSimRacing
    ? `Every sim racing YouTube creator we track on ${brand.siteName}. Browse race replays, setup guides, and hardware reviews by channel.`
    : `Every Warhammer YouTube creator we track on ${brand.siteName}. Browse battle reports and army lists by channel.`;
  const url = `https://${brand.domain}/channels`;
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
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${brand.siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ChannelsHubPage() {
  const config = getSiteVertical();
  const brand = getSiteBrand();

  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const verticalId = verticalRow?.id;
  const channels = verticalId ? await getChannelsForVertical(verticalId) : [];

  // Fetch video count per channel in one query
  const { data: countRows } = verticalId
    ? await supabase
        .from("battle_reports")
        .select("channel_id")
        .eq("vertical_id", verticalId)
    : { data: [] };

  const videoCountByChannel = new Map<string, number>();
  for (const row of (countRows ?? []) as { channel_id: string | null }[]) {
    if (!row.channel_id) continue;
    videoCountByChannel.set(
      row.channel_id,
      (videoCountByChannel.get(row.channel_id) ?? 0) + 1,
    );
  }

  const isSimRacing = config.slug === "simracing";
  const title = isSimRacing
    ? "Sim Racing YouTube Channels"
    : "Warhammer YouTube Channels";

  const hubLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: `https://${brand.domain}/channels`,
    hasPart: channels.map((c) => ({
      "@type": "Organization",
      name: c.name,
      url: `https://${brand.domain}/channels/${channelSlug(c.name)}`,
    })),
  };

  return (
    <>
      <JsonLd data={hubLd} />
      <Nav active="" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Every creator we track. Click any channel to see their full
          catalogue of {isSimRacing ? "race replays and setup guides" : "battle reports and army lists"} on {brand.siteName}.
        </p>

        {channels.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
            No channels tracked yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((c: Channel) => {
              const slug = channelSlug(c.name);
              const videoCount = videoCountByChannel.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/channels/${slug}`}
                  className="group rounded-xl border border-border bg-card p-5 hover:border-[var(--vertical-accent)]/40 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {c.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.thumbnail_url}
                        alt={c.name}
                        className="w-14 h-14 rounded-full shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted shrink-0 flex items-center justify-center text-muted-foreground">
                        ?
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold truncate group-hover:text-[var(--vertical-accent-light)] transition-colors">
                        {c.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {c.subscriber_count > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {formatSubscribers(c.subscriber_count)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {videoCount} {isSimRacing ? "replay" : "report"}
                          {videoCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
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
