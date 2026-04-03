"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DesktopConnectClient() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  const createSession = useCallback(async () => {
    setBusy(true);
    setError(null);
    setDeepLink(null);
    try {
      const res = await fetch("/api/desktop/session", { method: "POST" });
      const data = (await res.json()) as { token?: string; error?: string };
      if (res.status === 401) {
        window.location.href =
          "/sign-in?redirect_url=" + encodeURIComponent("/desktop/connect");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `Hata ${res.status}`);
        return;
      }
      if (!data.token) {
        setError("Jeton alınamadı.");
        return;
      }
      const q = new URLSearchParams({ token: data.token });
      setDeepLink(`promptly://connect?${q.toString()}`);
    } catch {
      setError("Ağ hatası.");
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Masaüstü uygulamasını bağla</CardTitle>
        <CardDescription>
          Oturumun açık. Aşağıdan oturum anahtarını oluşturup Promptly macOS
          uygulamasına gönder.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!deepLink ? (
          <Button type="button" disabled={busy} onClick={() => void createSession()}>
            {busy ? "Hazırlanıyor…" : "Bağlantıyı oluştur"}
          </Button>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Açılan bağlantı Promptly uygulamasını otomatik bağlar. İlk seferde
              macOS onay isteyebilir.
            </p>
            <a
              href={deepLink}
              className={cn(buttonVariants({ variant: "default" }), "inline-flex w-full")}
            >
              Promptly uygulamasında aç
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyTokenFromLink()}
            >
              Jetonu panoya kopyala (yedek)
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setDeepLink(null);
              }}
            >
              Yeni bağlantı
            </Button>
          </>
        )}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-center text-xs text-muted-foreground">
          Hesabın yok mu?{" "}
          <Link
            href="/sign-up?redirect_url=%2Fdesktop%2Fconnect"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Kayıt ol
          </Link>
          {" · "}
          <Link
            href="/library"
            className="underline-offset-2 hover:underline"
          >
            Kütüphane
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
