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

function ConnectLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-[420px] shadow-lg ring-1 ring-border/60">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </CardContent>
      </Card>
    </div>
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
      <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-muted/80 to-muted/40 p-4 sm:p-6">
        <Card className="w-full max-w-[420px] overflow-hidden border-0 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader className="space-y-1 pb-2 text-center">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {authSignup ? "Hesap oluştur" : "Giriş yap"}
            </CardTitle>
            <CardDescription className="text-[15px] leading-snug">
              {authSignup
                ? "macOS uygulaması bu hesapla web kütüphanene bağlanır."
                : "Önce Apple / Google ile devam et veya e‑posta ile giriş yap."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-stretch gap-4 px-6 pb-6 pt-0">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-muted/80 to-muted/40 p-4 sm:p-6">
      <DesktopConnectSessionPanel />
    </div>
  );
}
