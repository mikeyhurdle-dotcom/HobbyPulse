import type { Metadata } from "next";
import { Syne, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { getSiteVertical, getSiteBrand } from "@/lib/site";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdMobileFooter } from "@/components/ad-slot";
import { Analytics } from "@/components/analytics";
import { Footer } from "@/components/footer";
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
    <html lang="en" suppressHydrationWarning>
      {process.env.NEXT_PUBLIC_ADSENSE_PUB_ID && (
        <head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body
        className={`${syne.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
        data-vertical={config.slug}
        style={
          {
            "--vertical-accent": config.theme.accent,
            "--vertical-accent-light": config.theme.accentLight,
            "--vertical-accent-glow": config.theme.accentGlow,
          } as React.CSSProperties
        }
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Footer />
            <AdMobileFooter />
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
