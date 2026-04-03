"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { DesktopAutoConnectRedirect } from "@/app/desktop/connect/DesktopAutoConnectRedirect";
import { DesktopConnectSessionPanel } from "@/app/desktop/connect/DesktopConnectSessionPanel";
import { Card, CardContent } from "@/components/ui/card";

function ConnectPageShell({
  children,
  tagline,
}: {
  children: React.ReactNode;
  tagline?: string;
}) {
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
            {tagline ?? "Masaüstü ↔ web hesabı"}
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}

function ConnectLoading({
  tagline,
  hint,
}: {
  tagline?: string;
  hint?: string;
}) {
  return (
    <ConnectPageShell tagline={tagline}>
      <Card className="border bg-card shadow-lg">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-sm text-muted-foreground">
          <div
            className="size-8 animate-pulse rounded-full bg-muted"
            aria-hidden
          />
          {hint ?? "Yükleniyor…"}
        </CardContent>
      </Card>
    </ConnectPageShell>
  );
}

export function DesktopConnectView() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authSignup = searchParams.get("auth") === "signup";
  const fromDesktop = searchParams.get("from_desktop") === "1";
  const desktopTagline = fromDesktop
    ? "Girişten sonra Mac uygulaması açılır."
    : undefined;

  const qs = searchParams.toString();
  const didSendToClerk = useRef(false);

  useEffect(() => {
    if (!isLoaded || userId || didSendToClerk.current) return;
    didSendToClerk.current = true;
    const returnTo = qs ? `${pathname}?${qs}` : pathname;
    const enc = encodeURIComponent(returnTo);
    const target = authSignup
      ? `/sign-up?redirect_url=${enc}`
      : `/sign-in?redirect_url=${enc}`;
    router.replace(target);
  }, [isLoaded, userId, authSignup, pathname, qs, router]);

  if (!isLoaded || !userId) {
    return (
      <ConnectLoading
        tagline={desktopTagline}
        hint={
          isLoaded
            ? "Clerk giriş sayfasına yönlendiriliyor…"
            : undefined
        }
      />
    );
  }

  return (
    <ConnectPageShell tagline={desktopTagline}>
      {fromDesktop ? (
        <DesktopAutoConnectRedirect />
      ) : (
        <DesktopConnectSessionPanel />
      )}
    </ConnectPageShell>
  );
}
