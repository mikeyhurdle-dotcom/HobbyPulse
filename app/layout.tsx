import type { Metadata } from "next";
import { Syne, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { AdMobileFooter } from "@/components/ad-slot";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export function generateMetadata(): Metadata {
  const brand = getSiteBrand();

  return {
    title: {
      default: brand.siteName,
      template: `%s | ${brand.siteName}`,
    },
    description: brand.tagline,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getSiteVertical();

  return (
    <html lang="en" className="dark">
      <body
        className={`${syne.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
        data-vertical={config.slug}
        style={
          {
            "--vertical-accent": config.theme.accent,
            "--vertical-accent-light": config.theme.accentLight,
          } as React.CSSProperties
        }
      >
        {children}
        <AdMobileFooter />
      </body>
    </html>
  );
}
