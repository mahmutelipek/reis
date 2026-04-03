"use client";

import { UserButton } from "@clerk/nextjs";

export function LibraryUserMenu() {
  return (
    <div className="flex items-center gap-2">
      <UserButton afterSignOutUrl="/sign-in" />
    </div>
  );
}
