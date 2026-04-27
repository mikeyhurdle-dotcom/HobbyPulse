// ---------------------------------------------------------------------------
// Kickstarter helpers — read-side queries + formatters
// ---------------------------------------------------------------------------

import { supabase } from "@/lib/supabase";

export interface KickstarterRow {
  id: string;
  external_id: string;
  slug: string;
  title: string;
  url: string;
  image_url: string | null;
  creator: string | null;
  category: string;
  blurb: string | null;
  funded_amount: number | null;
  goal_amount: number | null;
  currency: string;
  funded_percent: number | null;
  backers: number | null;
  ends_at: string | null;
  late_pledge_url: string | null;
  late_pledge_open: boolean;
  status: "live" | "ending_soon" | "recently_funded" | "late_pledge" | "ended";
  last_synced_at: string | null;
  updated_at: string;
}

export async function getKickstarterByStatus(
  status: KickstarterRow["status"],
  limit = 24,
): Promise<KickstarterRow[]> {
  const orderColumn = status === "ending_soon" ? "ends_at" : "funded_percent";
  const ascending = status === "ending_soon";
  const { data } = await supabase
    .from("kickstarter_projects")
    .select("*")
    .eq("status", status)
    .order(orderColumn, { ascending, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as KickstarterRow[];
}

export async function getKickstarterBySlug(
  slug: string,
): Promise<KickstarterRow | null> {
  const { data } = await supabase
    .from("kickstarter_projects")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data ?? null) as KickstarterRow | null;
}

export async function getEndingSoonHero(limit = 3): Promise<KickstarterRow[]> {
  const { data } = await supabase
    .from("kickstarter_projects")
    .select("*")
    .in("status", ["ending_soon", "live"])
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as KickstarterRow[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
};

export function formatMoney(amountMinor: number | null, currency = "USD"): string {
  if (amountMinor == null) return "—";
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const major = amountMinor / 100;
  if (major >= 1_000_000) return `${symbol}${(major / 1_000_000).toFixed(1)}M`;
  if (major >= 1_000) return `${symbol}${Math.round(major / 1_000)}K`;
  return `${symbol}${major.toFixed(0)}`;
}

export function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function formatPercent(percent: number | null): string {
  if (percent == null) return "—";
  if (percent >= 1000) return `${Math.round(percent)}%`;
  return `${percent.toFixed(0)}%`;
}
