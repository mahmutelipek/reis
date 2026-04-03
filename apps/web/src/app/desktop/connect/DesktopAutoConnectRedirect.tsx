"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DesktopConnectEnvHelp } from "@/app/desktop/connect/DesktopConnectEnvHelp";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Phase = "fetching" | "opening" | "fallback" | "fail";

export function DesktopAutoConnectRedirect() {
  const [phase, setPhase] = useState<Phase>("fetching");
  const [error, setError] = useState<string | null>(null);
  const [needsSecret, setNeedsSecret] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const res = await fetch("/api/desktop/session", { method: "POST" });
        const data = (await res.json()) as { token?: string; error?: string };
        if (cancelled) return;

        if (res.status === 401) {
          window.location.href = "/desktop/connect?from_desktop=1";
          return;
        }
        if (res.status === 503) {
          setNeedsSecret(true);
          setError(
            data.error ??
              "Sunucuda DESKTOP_SESSION_SECRET tanımlı değil. Aşağıdaki adımlarla ekle.",
          );
          setPhase("fail");
          return;
        }
        if (!res.ok) {
          setError(data.error ?? `Sunucu hatası (${res.status})`);
          setPhase("fail");
          return;
        }
        if (!data.token) {
          setError("Jeton alınamadı.");
          setPhase("fail");
          return;
        }

        const q = new URLSearchParams({ token: data.token });
        const link = `promptly://connect?${q.toString()}`;
        setDeepLink(link);
        setPhase("opening");
        window.location.href = link;
        fallbackTimer = setTimeout(() => {
          if (!cancelled) setPhase("fallback");
        }, 2000);
      } catch {
        if (!cancelled) {
          setError("Ağ hatası. Bağlantını kontrol et.");
          setPhase("fail");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
    };
  }, []);

  if (phase === "fetching" || phase === "opening") {
    return (
      <Card className="w-full overflow-hidden border bg-card shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-14">
          <div
            className="size-10 animate-pulse rounded-full bg-primary/25"
            aria-hidden
          />
          <p className="text-center text-sm font-medium text-foreground">
            {phase === "fetching"
              ? "Oturum hazırlanıyor…"
              : "Promptly açılıyor…"}
          </p>
          {phase === "opening" ? (
            <p className="max-w-[280px] text-center text-xs text-muted-foreground">
              Pencereyi kapatabilirsin. Uygulama açılmazsa birkaç saniye sonra burada
              yedek bağlantı görünür.
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (phase === "fail") {
    return (
      <Card className="w-full overflow-hidden border bg-card shadow-lg">
        <CardHeader className="space-y-1 border-b bg-muted/30 px-6 pb-4 pt-6 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Bağlanamadı
          </CardTitle>
          <CardDescription className="text-[15px] leading-relaxed">
            Aşağıdan düzelt veya manuel bağlantı sayfasına geç.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-6 py-6">
          {needsSecret || (error?.toLowerCase().includes("desktop_session") ?? false) ? (
            <DesktopConnectEnvHelp variant="prominent" />
          ) : null}
          {error ? (
            <div
              className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          <Link
            href="/desktop/connect"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full rounded-xl text-center font-semibold",
            )}
          >
            Manuel bağlantı (eski akış)
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden border bg-card shadow-lg">
      <CardHeader className="space-y-1 border-b bg-muted/30 px-6 pb-4 pt-6 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Uygulamayı aç
        </CardTitle>
        <CardDescription className="text-[15px] leading-relaxed">
          Tarayıcı uygulamayı açmana izin vermediyse aşağıdan Promptly’yi aç.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-6 py-6">
        {deepLink ? (
          <a
            href={deepLink}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-12 w-full rounded-xl text-base font-semibold shadow-sm",
            )}
          >
            Promptly’de aç
          </a>
        ) : null}
        <Separator />
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
  );
}
