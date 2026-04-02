// ---------------------------------------------------------------------------
// NavAuth — client component rendering sign-in or user menu
// ---------------------------------------------------------------------------

"use client";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { UserMenu } from "@/components/auth/user-menu";

interface NavAuthProps {
  user: {
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

export function NavAuth({ user }: NavAuthProps) {
  if (!user) {
    return <SignInDialog />;
  }

  return (
    <UserMenu
      email={user.email}
      displayName={user.displayName}
      avatarUrl={user.avatarUrl}
    />
  );
}
