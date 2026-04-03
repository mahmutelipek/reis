"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function randomHexSecret(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

const OPENSSL_CMD = "openssl rand -hex 24";

export function DesktopConnectEnvHelp({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "prominent" | "compact";
  className?: string;
}) {
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState<"cmd" | "val" | null>(null);

  const copyCmd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(OPENSSL_CMD);
      setCopied("cmd");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const genAndCopy = useCallback(async () => {
    const s = randomHexSecret();
    setGenerated(s);
    try {
      await navigator.clipboard.writeText(s);
      setCopied("val");
      window.setTimeout(() => setCopied(null), 2500);
    } catch {
      /* ignore */
    }
  }, []);

  if (variant === "compact") {
    return (
      <div className={cn("space-y-3 text-left text-sm text-muted-foreground", className)}>
        <p>
          <strong className="text-foreground">Bir yerden alınmaz.</strong> Kendi
          ürettiğin uzun rastgele metni Vercel’de{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            DESKTOP_SESSION_SECRET
          </code>{" "}
          olarak kaydedersin.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void genAndCopy()}>
            {copied === "val" ? "Kopyalandı" : "Rastgele üret + kopyala"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyCmd()}>
            {copied === "cmd" ? "OK" : "openssl komutu"}
          </Button>
        </div>
        {generated ? (
          <p className="font-mono text-xs text-foreground/80">
            {generated.slice(0, 20)}…
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border text-left text-sm",
        variant === "prominent"
          ? "border-amber-500/40 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/40"
          : "border-border bg-muted/40 p-4",
        className,
      )}
    >
      <p className="font-semibold text-foreground">
        Bu değeri nereden alırsın?
      </p>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Hiçbir yerden indirilmez.</strong>{" "}
        Sen veya ekip arkadaşın <strong className="text-foreground">rastgele</strong>{" "}
        bir metin üretir; Vercel’de (veya .env){" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          DESKTOP_SESSION_SECRET
        </code>{" "}
        adıyla kaydedersin. Clerk / Mux ile karıştırma — ayrı bir sır.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground marker:text-foreground">
        <li>
          <strong className="text-foreground">Vercel:</strong> Proje →{" "}
          <em>Settings</em> → <em>Environment Variables</em> →{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            DESKTOP_SESSION_SECRET
          </code>
        </li>
        <li>
          <strong className="text-foreground">Value:</strong> Aşağıdan üret veya
          Mac’te Terminal’de çalıştır:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {OPENSSL_CMD}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-1 h-7 px-2 text-xs"
            onClick={() => void copyCmd()}
          >
            {copied === "cmd" ? "Kopyalandı" : "Komutu kopyala"}
          </Button>
        </li>
        <li>
          Kaydet → projeyi <strong className="text-foreground">Redeploy</strong> et
          (env yeni build’de gelir).
        </li>
      </ol>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => void genAndCopy()}
        >
          {copied === "val"
            ? "Panoya kopyalandı — Vercel’e yapıştır"
            : "Rastgele değer üret ve panoya kopyala"}
        </Button>
        {generated ? (
          <code className="block truncate rounded-md bg-background px-2 py-1.5 font-mono text-xs ring-1 ring-border">
            {generated.slice(0, 16)}…
          </code>
        ) : null}
      </div>
    </div>
  );
}
