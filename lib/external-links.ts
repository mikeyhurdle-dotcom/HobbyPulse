/**
 * Generate a Wahapedia search link for a unit name.
 *
 * For simplicity we link to the search page rather than trying to resolve
 * the exact faction/unit slug.
 */
export function wahapediaLink(unitName: string, gameSystem: string): string {
  const systemMap: Record<string, string> = {
    "40k": "wh40k10",
    aos: "aos3",
    tow: "tow",
    kt: "kill-team",
  };

  const systemSlug = systemMap[gameSystem] ?? "wh40k10";
  return `https://wahapedia.ru/${systemSlug}/search/?q=${encodeURIComponent(unitName)}`;
}

/**
 * Generate a link to the official Warhammer App page.
 */
export function warhammerAppLink(): string {
  return "https://www.warhammer.com/en-GB/warhammer-app";
}
