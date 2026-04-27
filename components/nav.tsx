import Link from "next/link";
import Image from "next/image";
import { getSiteBrand, getSiteVertical } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { NavAuth } from "@/components/nav-auth";

interface NavTab {
  name: string;
  href: string;
  key: string;
  icon: string;
  verticalOnly?: string;
}

const allTabs: NavTab[] = [
  { name: "Board Games", href: "/boardgames", key: "boardgames", icon: "🎲", verticalOnly: "tabletop" },
  { name: "Watch", href: "/watch", key: "watch", icon: "▶", verticalOnly: "simracing" },
  { name: "Setups", href: "/setups", key: "setups", icon: "⚙", verticalOnly: "simracing" },
  { name: "Deals", href: "/deals", key: "deals", icon: "£" },
  { name: "Blog", href: "/blog", key: "blog", icon: "✎" },
  { name: "Live", href: "/live", key: "live", icon: "●" },
];

export async function Nav({ active }: { active: string }) {
  const brand = getSiteBrand();
  const vertical = getSiteVertical();

  const tabs = allTabs.filter(
    (tab) => !tab.verticalOnly || tab.verticalOnly === vertical.slug,
  );

  const activeKey = active;

  // Auth — gracefully degrade if Supabase auth is not configured
  let authUser: {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null = null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      authUser = {
        email: user.email ?? "",
        displayName:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      };
    }
  } catch {
    // Auth not configured — sign-in button will be hidden
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            {brand.logo ? (
              <Image
                src={brand.logo}
                alt={brand.siteName}
                width={200}
                height={48}
                className="h-9 sm:h-10 w-auto"
                priority
              />
            ) : (
              <span className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight">
                {brand.siteName}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`relative px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeKey === tab.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span>{tab.name}</span>
                {activeKey === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--vertical-accent)]" />
                )}
                {tab.key === "live" && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                )}
              </Link>
            ))}
          </div>

          {/* Right side: auth + theme toggle + mobile menu */}
          <div className="flex items-center gap-2">
            <NavAuth user={authUser} />
            <ThemeToggle />
            <MobileNav tabs={tabs} active={activeKey} brand={brand} />
          </div>
        </div>
      </div>
    </nav>
  );
}
