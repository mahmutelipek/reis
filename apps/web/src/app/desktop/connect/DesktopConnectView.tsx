"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DesktopConnectSessionPanel } from "@/app/desktop/connect/DesktopConnectSessionPanel";
import { clerkDesktopConnectAppearance } from "@/lib/clerk-desktop-connect-appearance";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ConnectPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[#f2f2f7] dark:bg-zinc-950">
      <div className="mx-auto flex min-h-svh w-full max-w-[440px] flex-col justify-center px-4 py-10 sm:px-6">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md">
            P
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Promptly
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masaüstü ↔ web hesabı
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}

function ConnectLoading() {
  return (
    <ConnectPageShell>
      <Card className="border bg-card shadow-lg">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-sm text-muted-foreground">
          <div
            className="size-8 animate-pulse rounded-full bg-muted"
            aria-hidden
          />
          Yükleniyor…
        </CardContent>
      </Card>
    </ConnectPageShell>
  );
}

export function DesktopConnectView() {
  const { isLoaded, userId } = useAuth();
  const searchParams = useSearchParams();
  const authSignup = searchParams.get("auth") === "signup";

  if (!isLoaded) {
    return <ConnectLoading />;
  }

  if (!userId) {
    return (
      <ConnectPageShell>
        <Card className="overflow-hidden border bg-card shadow-lg">
          <CardHeader className="space-y-1 border-b bg-muted/30 px-6 pb-4 pt-6 text-center">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {authSignup ? "Hesap oluştur" : "Giriş yap"}
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed">
              {authSignup
                ? "Aynı hesap web kütüphanende ve Mac uygulamasında kullanılır."
                : "Sosyal hesap veya e‑posta ile devam et."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-5">
            <div className="flex flex-col gap-5">
              {authSignup ? (
                <SignUp
                  routing="virtual"
                  appearance={clerkDesktopConnectAppearance}
                  signInUrl="/desktop/connect"
                  forceRedirectUrl="/desktop/connect"
                />
              ) : (
                <SignIn
                  routing="virtual"
                  appearance={clerkDesktopConnectAppearance}
                  signUpUrl="/desktop/connect?auth=signup"
                  forceRedirectUrl="/desktop/connect"
                />
              )}
              <Link
                href="/library"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground",
                )}
              >
                Kütüphaneye dön
              </Link>
            </div>
          </CardContent>
        </Card>
      </ConnectPageShell>
    );
  }

  return (
    <ConnectPageShell>
      <DesktopConnectSessionPanel />
    </ConnectPageShell>
  );
}
