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

type Phase = "fetching" | "ready" | "fail";

export function DesktopAutoConnectRedirect() {
  const [phase, setPhase] = useState<Phase>("fetching");
  const [error, setError] = useState<string | null>(null);
  const [needsSecret, setNeedsSecret] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
        setPhase("ready");

        // Çoğu tarayıcı bunu kullanıcı tıklaması olmadan engeller; yine de dene.
        queueMicrotask(() => {
          if (!cancelled) window.location.assign(link);
        });
      } catch {
        if (!cancelled) {
          setError("Ağ hatası. Bağlantını kontrol et.");
          setPhase("fail");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "fetching") {
    return (
      <Card className="w-full overflow-hidden border bg-card shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-14">
          <div
            className="size-10 animate-pulse rounded-full bg-primary/25"
            aria-hidden
          />
          <p className="text-center text-sm font-medium text-foreground">
            Oturum hazırlanıyor…
          </p>
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
          Promptly’yi aç
        </CardTitle>
        <CardDescription className="text-[15px] leading-relaxed">
          Tarayıcılar <code className="rounded bg-muted px-1 py-0.5 text-xs">promptly://</code>{" "}
          bağlantısını çoğu zaman otomatik açmaz. Aşağıdaki büyük düğmeye mutlaka tıkla — Promptly
          marka rengi, Mac uygulamasındaki ana kayıt düğmesiyle aynı. macOS “Promptly’yi aç” diye
          soracak.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6 py-6">
        {deepLink ? (
          <a
            href={deepLink}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-14 w-full rounded-xl text-base font-semibold shadow-sm",
            )}
          >
            Promptly uygulamasını aç
          </a>
        ) : null}
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          Uygulamayı <code className="rounded bg-muted px-1 py-0.5 text-[11px]">swift run</code> ile
          çalıştırıyorsan güncel sürümde <code className="rounded bg-muted px-1 py-0.5 text-[11px]">promptly://</code>{" "}
          binary içine gömülü; yine açılmazsa Xcode +{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">Promptly-Info.plist.example</code>{" "}
          kullan.
        </p>
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
