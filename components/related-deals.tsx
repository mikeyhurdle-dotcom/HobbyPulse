// ---------------------------------------------------------------------------
// Related Deals — shows products in the same category
// ---------------------------------------------------------------------------

import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  listings: { price_pence: number }[];
}

function formatPrice(pence: number): string {
  return `\u00A3${(pence / 100).toFixed(2)}`;
}

export async function RelatedDeals({
  verticalId,
  currentSlug,
}: {
  verticalId: string;
  currentSlug: string;
}) {
  const { data: rawRelated } = await supabase
    .from("products")
    .select("id, name, slug, image_url, listings ( price_pence )")
    .eq("vertical_id", verticalId)
    .neq("slug", currentSlug)
    .limit(4);

  const related = (rawRelated ?? []) as unknown as RelatedProduct[];
  if (related.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight mb-4">
        Related Products
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {related.map((product) => {
          const bestPrice = product.listings?.reduce<number | null>(
            (best, l) => (best === null || l.price_pence < best ? l.price_pence : best),
            null,
          );

          return (
            <Link
              key={product.id}
              href={`/deals/${product.slug}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <div className="relative aspect-square bg-[var(--surface-hover)]">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[var(--muted)] text-xs">No image</span>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <h3 className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-[var(--vertical-accent-light)] transition-colors">
                  {product.name}
                </h3>
                {bestPrice !== null && (
                  <p className="text-sm font-bold text-[var(--success)]">
                    {formatPrice(bestPrice)}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
