import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseArmyList } from "@/lib/parser";
import { getSiteVertical } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_REPORTS_PER_RUN = 20;

// ---------------------------------------------------------------------------
// Admin Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// GET /api/cron/parse
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  // ---- Auth guard ----
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const siteVertical = getSiteVertical();

  // Look up the vertical ID for this deployment
  const { data: verticalRow } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", siteVertical.slug)
    .single();

  if (!verticalRow) {
    return NextResponse.json({ error: `Vertical ${siteVertical.slug} not found in database` }, { status: 500 });
  }

  // 1. Find unparsed battle reports for this vertical
  const { data: reports, error: fetchError } = await supabase
    .from("battle_reports")
    .select("id, description")
    .eq("vertical_id", verticalRow.id)
    .is("parsed_at", null)
    .order("published_at", { ascending: false })
    .limit(MAX_REPORTS_PER_RUN);

  if (fetchError) {
    console.error("Failed to fetch unparsed reports:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }

  if (!reports || reports.length === 0) {
    return NextResponse.json({ message: "No unparsed reports found" });
  }

  let totalListsCreated = 0;
  let totalItemsCreated = 0;
  const errors: string[] = [];

  // 2. Parse each report
  for (const report of reports) {
    try {
      const lists = await parseArmyList(report.description ?? "");

      // Even if no lists found, mark as parsed so we don't retry
      const maxConfidence =
        lists.length > 0
          ? Math.max(...lists.map((l) => l.confidence))
          : 0;

      // 3. Look up category IDs by faction name
      const factionNames = [...new Set(lists.map((l) => l.faction))];
      let categoryMap: Record<string, string> = {};

      if (factionNames.length > 0) {
        const { data: categories } = await supabase
          .from("categories")
          .select("id, name")
          .in("name", factionNames);

        if (categories) {
          categoryMap = Object.fromEntries(
            categories.map((c) => [c.name, c.id]),
          );
        }
      }

      // 4. Insert content_lists and list_items
      for (let i = 0; i < lists.length; i++) {
        const list = lists[i];
        const categoryId = categoryMap[list.faction] ?? null;

        const { data: insertedList, error: listError } = await supabase
          .from("content_lists")
          .insert({
            battle_report_id: report.id,
            category_id: categoryId,
            player_name: list.player_name,
            detachment: list.detachment,
            total_points: list.total_points,
            list_index: i,
            raw_text: list.raw_text,
          })
          .select("id")
          .single();

        if (listError) {
          console.error(
            `Error inserting content_list for report ${report.id}:`,
            listError,
          );
          errors.push(`report ${report.id} list ${i}: ${listError.message}`);
          continue;
        }

        totalListsCreated++;

        // Insert individual list items
        if (list.units.length > 0) {
          const itemRows = list.units.map((unit, sortOrder) => ({
            content_list_id: insertedList.id,
            name: unit.name,
            quantity: unit.qty,
            points: unit.points,
            enhancements: unit.enhancements,
            wargear: unit.wargear,
            sort_order: sortOrder,
          }));

          const { error: itemsError } = await supabase
            .from("list_items")
            .insert(itemRows);

          if (itemsError) {
            console.error(
              `Error inserting list_items for list ${insertedList.id}:`,
              itemsError,
            );
            errors.push(`list ${insertedList.id} items: ${itemsError.message}`);
          } else {
            totalItemsCreated += itemRows.length;
          }
        }
      }

      // 5. Update the battle report as parsed
      const { error: updateError } = await supabase
        .from("battle_reports")
        .update({
          parsed_at: new Date().toISOString(),
          parse_confidence: maxConfidence,
        })
        .eq("id", report.id);

      if (updateError) {
        console.error(
          `Error updating parsed_at for report ${report.id}:`,
          updateError,
        );
        errors.push(`update report ${report.id}: ${updateError.message}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error parsing report ${report.id}:`, message);
      errors.push(`report ${report.id}: ${message}`);

      // Mark as parsed with 0 confidence so we don't retry indefinitely
      await supabase
        .from("battle_reports")
        .update({
          parsed_at: new Date().toISOString(),
          parse_confidence: 0,
        })
        .eq("id", report.id);
    }
  }

  return NextResponse.json({
    success: true,
    reportsParsed: reports.length,
    listsCreated: totalListsCreated,
    itemsCreated: totalItemsCreated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
