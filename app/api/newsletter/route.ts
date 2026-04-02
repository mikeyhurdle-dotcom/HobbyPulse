// ---------------------------------------------------------------------------
// Newsletter Signup API — POST { email, vertical }
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string; vertical?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const vertical = body.vertical?.trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (!vertical) {
    return NextResponse.json({ error: "Vertical is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if already subscribed (acts as basic rate-limit / dedup)
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, is_active")
    .eq("email", email)
    .eq("vertical_slug", vertical)
    .maybeSingle();

  if (existing) {
    if (existing.is_active) {
      return NextResponse.json(
        { error: "You're already subscribed!" },
        { status: 409 },
      );
    }

    // Re-activate if previously unsubscribed
    await supabase
      .from("newsletter_subscribers")
      .update({ is_active: true })
      .eq("id", existing.id);

    return NextResponse.json({ ok: true, reactivated: true });
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    vertical_slug: vertical,
  });

  if (error) {
    console.error("Newsletter insert error:", error.message);
    return NextResponse.json(
      { error: "Something went wrong — please try again" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
