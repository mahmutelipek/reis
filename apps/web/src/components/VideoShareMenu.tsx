"use client";

import {
  ChevronDown,
  Copy,
  ExternalLink,
  Code2,
  Link2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  shareSlug: string;
  appBaseUrl: string;
  status: string;
  hasPassword: boolean;
};

function buildShareUrl(base: string, slug: string) {
  const origin = base.replace(/\/$/, "");
  return origin ? `${origin}/v/${slug}` : "";
}

function buildEmbedCode(base: string, slug: string) {
  const origin = base.replace(/\/$/, "");
  if (!origin) return "";
  const src = `${origin}/v/${slug}/embed`;
  return `<iframe src="${src}" width="560" height="315" style="max-width:100%;border:0;border-radius:8px" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}

export function VideoShareMenu({
  shareSlug,
  appBaseUrl,
  status,
  hasPassword,
}: Props) {
  const [hint, setHint] = useState<string | null>(null);
  const shareUrl = buildShareUrl(appBaseUrl, shareSlug);
  const embedCode = buildEmbedCode(appBaseUrl, shareSlug);
  const ready = status === "ready" && shareUrl;

  const shareLabel = !ready
    ? "İşleniyor"
    : hasPassword
      ? "Şifre korumalı"
      : "Link ile paylaşılıyor";

  function flash(msg: string) {
    setHint(msg);
    setTimeout(() => setHint(null), 2000);
  }

  async function copyText(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(ok);
    } catch {
      flash("Kopyalanamadı");
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="h-8 max-w-[200px] gap-1 border-dashed text-muted-foreground"
        >
          <span className="truncate">{shareLabel}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
        {hint ? (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          nativeButton
          className="inline-flex h-8 max-w-[220px] items-center justify-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="truncate">{shareLabel}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Paylaşım
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => copyText(shareUrl, "Link kopyalandı")}
            className="gap-2"
          >
            <Link2 className="size-4" />
            Paylaşım linkini kopyala
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")}
            className="gap-2"
          >
            <ExternalLink className="size-4" />
            Yeni sekmede aç
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!embedCode}
            onClick={() =>
              embedCode
                ? copyText(embedCode, "Embed kodu kopyalandı")
                : undefined
            }
            className="gap-2"
          >
            <Code2 className="size-4" />
            Embed kodunu kopyala
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!embedCode}
            onClick={() => {
              const origin = appBaseUrl.replace(/\/$/, "");
              if (origin) {
                void copyText(
                  `${origin}/v/${shareSlug}/embed`,
                  "Önizleme URL kopyalandı",
                );
              }
            }}
            className="gap-2"
          >
            <Copy className="size-4" />
            iframe src URL kopyala
          </DropdownMenuItem>
          {hasPassword ? (
            <>
              <DropdownMenuSeparator />
              <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
                Şifre açık: izleyici önce şifre girer. Bazı sitelerde iframe
                çerez kısıtı olabilir.
              </p>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {hint ? (
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
