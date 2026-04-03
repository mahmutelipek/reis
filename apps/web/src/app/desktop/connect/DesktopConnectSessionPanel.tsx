"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { DesktopConnectEnvHelp } from "@/app/desktop/connect/DesktopConnectEnvHelp";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DesktopConnectSessionPanel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSecret, setNeedsSecret] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  const createSession = useCallback(async () => {
    setBusy(true);
    setError(null);
    setNeedsSecret(false);
    setDeepLink(null);
    try {
      const res = await fetch("/api/desktop/session", { method: "POST" });
      const data = (await res.json()) as { token?: string; error?: string };
      if (res.status === 401) {
        window.location.href = "/desktop/connect";
        return;
      }
      if (res.status === 503) {
        setNeedsSecret(true);
        setError(
          data.error ??
            "Sunucuda DESKTOP_SESSION_SECRET tanımlı değil. Aşağıdaki adımlarla ekle.",
        );
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `Sunucu hatası (${res.status})`);
        return;
      }
      if (!data.token) {
        setError("Jeton alınamadı.");
        return;
      }
      const q = new URLSearchParams({ token: data.token });
      setDeepLink(`promptly://connect?${q.toString()}`);
    } catch {
      setError("Ağ hatası. Bağlantını kontrol et.");
    } finally {
      setBusy(false);
    }
  }, []);

  const copyTokenFromLink = useCallback(async () => {
    if (!deepLink) return;
    const u = new URL(deepLink);
    const token = u.searchParams.get("token");
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      /* ignore */
    }
  }, [deepLink]);

  return (
    <Card className="w-full overflow-hidden border bg-card shadow-lg">
      <CardHeader className="space-y-1 border-b bg-muted/30 px-6 pb-4 pt-6 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Mac uygulamasını bağla
        </CardTitle>
        <CardDescription className="text-[15px] leading-relaxed">
          Tek kullanımlık oturum anahtarı oluştur; Promptly masaüstünde{" "}
          <span className="whitespace-nowrap">«Panodan bağlan»</span> veya uygulama
          bağlantısıyla kullan.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 px-6 py-6">
        {needsSecret || (error && error.toLowerCase().includes("desktop_session")) ? (
          <DesktopConnectEnvHelp variant="prominent" />
        ) : null}

        {error && !needsSecret ? (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {!deepLink ? (
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-sm"
              onClick={() => void createSession()}
            >
              {busy ? "Hazırlanıyor…" : "Bağlantıyı oluştur"}
            </Button>
            <details className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground outline-none">
                Sunucu sırrı (DESKTOP_SESSION_SECRET) nereden gelir?
              </summary>
              <div className="mt-3 border-t border-border/60 pt-3">
                <DesktopConnectEnvHelp variant="compact" />
              </div>
            </details>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              Önce uygulamayı açmayı dene. Açılmazsa jetonu kopyala, uygulamada{" "}
              <strong className="text-foreground">Panodan bağlan</strong>’a bas.
            </p>
            <a
              href={deepLink}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 w-full rounded-xl text-base font-semibold shadow-sm",
              )}
            >
              Promptly’de aç
            </a>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-xl text-base"
              onClick={() => void copyTokenFromLink()}
            >
              Jetonu panoya kopyala
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setDeepLink(null);
                setError(null);
                setNeedsSecret(false);
              }}
            >
              Baştan başla
            </Button>
          </div>
        )}

        <Separator />

        <div className="flex flex-col items-center gap-2">
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
  );
}
