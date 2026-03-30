import type { Metadata } from "next";
import { getSiteBrand } from "@/lib/site";

export function generateMetadata(): Metadata {
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
  return children;
}
