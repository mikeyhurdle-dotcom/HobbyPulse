import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteBrand, getSiteVertical } from "@/lib/site";

export function generateMetadata(): Metadata {
  const config = getSiteVertical();
  if (config.slug === "simracing") return {};

  const brand = getSiteBrand();
  return {
    title: "Build My Army Cheap",
    description:
      "Paste your army list and find the cheapest way to buy every unit across all tracked retailers.",
    openGraph: {
      title: `Build My Army Cheap | ${brand.siteName}`,
      description:
        "Paste your army list and find the cheapest way to buy every unit across all tracked retailers.",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function BuildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getSiteVertical();
  if (config.slug === "simracing") {
    notFound();
  }
  return children;
}
