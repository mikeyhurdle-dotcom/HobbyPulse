import { getSiteVertical } from "@/lib/site";

export const TABLETOP_TITLE_SUFFIX = "Tabletop Watch — Board Games & Miniatures";

export function getMetaTitleSuffix(): string {
  const config = getSiteVertical();
  if (config.slug === "warhammer") return TABLETOP_TITLE_SUFFIX;
  return config.brand.siteName;
}

export function withMetaTitle(pageTitle: string): string {
  return `${pageTitle} | ${getMetaTitleSuffix()}`;
}
