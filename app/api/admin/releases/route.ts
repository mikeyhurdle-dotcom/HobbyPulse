// ---------------------------------------------------------------------------
// Admin: CRUD for the releases calendar
// ---------------------------------------------------------------------------
// Protected by CRON_SECRET. Used to seed and update upcoming product launches
// until an auto-scraper is in place.
//
// GET    /api/admin/releases              — list all releases for the vertical
// POST   /api/admin/releases              — create a release
// PATCH  /api/admin/releases              — update a release (requires ?id=)
// DELETE /api/admin/releases?id=          — delete a release
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteVertical } from "@/lib/site";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
);

function auth(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

async function getVerticalId(): Promise<string | null> {
  const config = getSiteVertical();
  const { data } = await supabase.from("verticals").select("id").eq("slug", config.slug).single();
  return data?.id ?? null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const verticalId = await getVerticalId();
  if (!verticalId) return NextResponse.json({ error: "Vertical not found" }, { status: 404 });

  const { data } = await supabase
    .from("releases")
    .select("*")
    .eq("vertical_id", verticalId)
    .order("release_date", { ascending: true });

  return NextResponse.json({ ok: true, releases: data ?? [] });
}

export async function POST(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const verticalId = await getVerticalId();
  if (!verticalId) return NextResponse.json({ error: "Vertical not found" }, { status: 404 });

  const body = await request.json();
  const {
    name,
    description,
    release_date,
    category_slug,
    image_url,
    pre_order_url,
    retailer,
    rrp_pence,
    current_best_pence,
    notes,
    status,
  } = body as Record<string, unknown>;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Resolve optional category_slug → category_id for linking to /deals/c pages
  let category_id: string | null = null;
  if (typeof category_slug === "string" && category_slug.length > 0) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("vertical_id", verticalId)
      .eq("slug", category_slug)
      .maybeSingle();
    category_id = cat?.id ?? null;
  }

  const { data, error } = await supabase
    .from("releases")
    .insert({
      vertical_id: verticalId,
      name,
      slug: slugify(String(name)),
      description: description ?? null,
      release_date: release_date ?? null,
      category_id,
      image_url: image_url ?? null,
      pre_order_url: pre_order_url ?? null,
      retailer: retailer ?? null,
      rrp_pence: rrp_pence ?? null,
      current_best_pence: current_best_pence ?? null,
      notes: notes ?? null,
      status: status ?? "upcoming",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, release: data });
}

export async function PATCH(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  // Whitelist patchable fields to prevent accidentally overwriting vertical_id, etc.
  const patch: Record<string, unknown> = {};
  for (const key of [
    "name",
    "description",
    "release_date",
    "image_url",
    "pre_order_url",
    "retailer",
    "rrp_pence",
    "current_best_pence",
    "notes",
    "status",
  ]) {
    if (key in body) patch[key] = body[key];
  }
  if (typeof body.name === "string") patch.slug = slugify(body.name);
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("releases")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, release: data });
}

export async function DELETE(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const { error } = await supabase.from("releases").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
