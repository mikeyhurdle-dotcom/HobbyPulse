// ---------------------------------------------------------------------------
// User Menu — dropdown for authenticated users
// ---------------------------------------------------------------------------

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface UserMenuProps {
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
}

export function UserMenu({ displayName, avatarUrl, email }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  const initials = (displayName ?? email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-8 h-8 overflow-hidden"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? "Avatar"}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full rounded-full bg-[var(--vertical-accent)] text-white text-xs font-bold">
              {initials}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          {displayName && (
            <p className="text-sm font-medium truncate">{displayName}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="w-4 h-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
