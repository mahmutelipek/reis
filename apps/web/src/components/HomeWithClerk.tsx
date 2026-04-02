"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function HomeWithClerk() {
  return (
    <div className="flex min-h-svh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="text-lg font-semibold tracking-tight">Promptly</span>
        <nav className="flex items-center gap-4 text-sm">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white"
              >
                Giriş
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/library" className="text-blue-600 dark:text-blue-400">
              Kütüphane
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
          Söyle, göster, paylaş.
        </h1>
        <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Async kurumsal video: sesle senkron, ekranda görünmeyen teleprompter ve
          tek tık paylaşım. Masaüstü kayıt uygulaması geliştiriliyor; web
          kütüphanesi şimdiden hazır.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white"
              >
                Başla
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/library"
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white"
            >
              Kütüphaneye git
            </Link>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}
