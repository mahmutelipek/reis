"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function LibraryUserMenu() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/" className="text-sm text-blue-600 dark:text-blue-400">
        Ana sayfa
      </Link>
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
