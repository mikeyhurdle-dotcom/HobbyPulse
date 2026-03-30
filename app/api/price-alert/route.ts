// ---------------------------------------------------------------------------
// POST /api/price-alert — create a new price alert
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createPriceAlert } from "@/lib/price-alerts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, productId, targetPricePence } = body as {
      email?: string;
      productId?: string;
      targetPricePence?: number;
    };

    // Validate
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 },
      );
    }

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 },
      );
    }

    if (
      targetPricePence == null ||
      typeof targetPricePence !== "number" ||
      targetPricePence <= 0
    ) {
      return NextResponse.json(
        { error: "targetPricePence must be a positive number" },
        { status: 400 },
      );
    }

    await createPriceAlert(email, productId, targetPricePence);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/price-alert error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
