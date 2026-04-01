"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavTab {
  name: string;
  href: string;
  key: string;
  icon: string;
}

interface MobileNavProps {
  tabs: NavTab[];
  active: string;
  brand: { siteName: string };
}

export function MobileNav({ tabs, active, brand }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background border-border">
        <SheetHeader className="text-left">
          <SheetTitle className="font-[family-name:var(--font-display)] text-lg tracking-tight">
            {brand.siteName}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-6">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active === tab.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <span className="text-base w-5 text-center">{tab.icon}</span>
              <span>{tab.name}</span>
              {active === tab.key && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--vertical-accent)]" />
              )}
              {tab.key === "live" && active !== tab.key && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
              )}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
