import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { ArmyCostBadge } from "@/components/army-cost-badge";
import { ShareButtons } from "@/components/share-buttons";
import { supabase } from "@/lib/supabase";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { computeArmyCost, serializeListForBuild } from "@/lib/army-cost";
import { Trophy, ArrowLeft, Play, Users } from "lucide-react";

export const revalidate = 3600;

interface ListData {
  id: string;
  player_name: string | null;
  winner: string | null;
  detachment: string | null;
  total_points: number | null;
  categories: { id: string; name: string; slug: string; colour: string | null } | null;
  battle_reports: {
    id: string;
    youtube_video_id: string;
    title: string;
    thumbnail_url: string | null;
    view_count: number;
    published_at: string;
    channels: { name: string | null } | null;
  } | null;
  list_items: { id: string; name: string; quantity: number; points: number; sort_order: number }[];
}

async function getListData(id: string) {
  const { data } = await supabase
    .from("content_lists")
    .select(
      `id, player_name, winner, detachment, total_points,
       categories ( id, name, slug, colour ),
       battle_reports ( id, youtube_video_id, title, thumbnail_url, view_count, published_at, channels ( name ) ),
       list_items ( id, name, quantity, points, sort_order )`,
    )
    .eq("id", id)
    .maybeSingle();

  return (data ?? null) as unknown as ListData | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = getSiteBrand();
  const list = await getListData(slug);
  if (!list) return { title: "Army not found" };

  const faction = list.categories?.name ?? "Warhammer";
  const title = `${faction} Winning List — ${list.total_points ?? ""}pts — Cheapest to Build`;
  const description = `Competitive ${faction} army list from ${list.battle_reports?.channels?.name ?? "a tracked battle report"}. See the total build cost across every retailer and buy every unit at the best price.`;
  const url = `https://${brand.domain}/armies/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${brand.siteName}`,
      description,
      url,
      siteName: brand.siteName,
      type: "article",
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

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

export default async function ArmyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getSiteVertical();
  if (config.slug === "simracing") redirect("/setups");

  const list = await getListData(slug);
  if (!list || !list.battle_reports) notFound();

  const br = list.battle_reports;
  const items = [...(list.list_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const faction = list.categories?.name ?? "Unknown Faction";
  const brand = getSiteBrand();

  // Compute build cost using the shared helper (no Haiku)
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", config.slug)
    .single();

  const cost = verticalRow
    ? await computeArmyCost(
        items.map((i) => ({ name: i.name, qty: i.quantity, points: i.points })),
        verticalRow.id,
      )
    : null;

  const buildListText = serializeListForBuild(
    faction,
    items.map((i) => ({ name: i.name, qty: i.quantity, points: i.points })),
  );
  const buildUrl = `/build?list=${encodeURIComponent(buildListText)}`;
  const pageUrl = `https://${brand.domain}/armies/${slug}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${faction} Winning List — ${list.total_points}pts`,
    url: pageUrl,
    datePublished: br.published_at,
    author: { "@type": "Person", name: list.player_name ?? "Unknown" },
    publisher: { "@type": "Organization", name: brand.siteName },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://${brand.domain}` },
      { "@type": "ListItem", position: 2, name: "Armies", item: `https://${brand.domain}/armies` },
      { "@type": "ListItem", position: 3, name: faction, item: pageUrl },
    ],
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      <Nav active="" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/armies"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All winning armies
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vertical-accent)] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3">
            <Trophy className="w-3 h-3" />
            Winning list
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
            style={{ color: list.categories?.colour ?? undefined }}
          >
            {faction}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {list.total_points && (
              <span className="font-[family-name:var(--font-mono)]">
                {list.total_points} pts
              </span>
            )}
            {list.player_name && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Played by {list.player_name}
              </span>
            )}
            {list.detachment && <span>· {list.detachment}</span>}
          </div>
        </div>

        {/* Cost badge */}
        {cost && cost.matchedUnitCount > 0 && (
          <ArmyCostBadge cost={cost} faction={faction} buildUrl={buildUrl} />
        )}

        {/* Source video */}
        <section className="mb-6">
          <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">
            Source battle report
          </h2>
          <Link
            href={`/watch/${br.youtube_video_id}`}
            className="group flex gap-4 rounded-xl border border-border bg-card p-4 hover:border-[var(--vertical-accent)]/40 transition-all"
          >
            <div className="relative w-40 aspect-video bg-muted rounded-lg overflow-hidden shrink-0">
              {br.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={br.thumbnail_url}
                  alt={br.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--vertical-accent)" }}
                >
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                {br.title}
              </h3>
              {br.channels?.name && (
                <p className="text-xs text-muted-foreground mt-1">{br.channels.name}</p>
              )}
            </div>
          </Link>
        </section>

        {/* Unit list */}
        <section className="mb-6">
          <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">
            Army composition · {items.length} units
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {items.map((item, i) => {
              const matched = cost?.units.find((u) => u.name === item.name);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${
                    i !== items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/deals?q=${encodeURIComponent(item.name)}`}
                      className="text-sm font-medium hover:text-[var(--vertical-accent-light)] transition-colors"
                    >
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground mr-1">{item.quantity}x</span>
                      )}
                      {item.name}
                    </Link>
                    {item.points > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">{item.points}pts</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {matched?.bestPrice ? (
                      <>
                        <span className="text-sm font-bold text-[var(--success)]">
                          {formatPrice(matched.bestPrice * item.quantity)}
                        </span>
                        <div className="text-[10px] text-muted-foreground">
                          {matched.source}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not found</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Share */}
        <div className="mb-6">
          <ShareButtons
            url={pageUrl}
            title={
              cost && cost.totalCost > 0
                ? `${faction} winning list — ${formatPrice(cost.totalCost)} to build`
                : `${faction} winning list`
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
