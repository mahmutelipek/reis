"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  status: string | null;
  text: string | null;
  error: string | null;
  /** Geniş ekranda sağ sütun: yapışkan panel + kaydırılabilir metin */
  variant?: "default" | "sidebar";
};

export function VideoTranscript({ status, text, error, variant = "default" }: Props) {
  const isSidebar = variant === "sidebar";
  const shell = (children: ReactNode) => (
    <section
      className={cn(
        "border border-zinc-800 bg-zinc-900/50 p-4",
        isSidebar
          ? "flex max-h-[min(70vh,560px)] flex-col rounded-xl lg:sticky lg:top-8"
          : "rounded-lg",
      )}
    >
      {children}
    </section>
  );

  if (status === "ready" && text) {
    return shell(
      <>
        <h2 className="shrink-0 text-sm font-medium text-zinc-400">Transkript</h2>
        <p
          className={cn(
            "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200",
            isSidebar && "min-h-0 flex-1 overflow-y-auto pr-1",
          )}
        >
          {text}
        </p>
      </>,
    );
  }

  if (status === "processing") {
    return shell(
      <p className="text-sm text-zinc-500">Transkript hazırlanıyor…</p>,
    );
  }

  if (status === "error" && error) {
    return shell(
      <p className="text-sm text-amber-600 dark:text-amber-400">
        Transkript hatası: {error}
      </p>,
    );
  }

  if (status === "skipped") {
    return shell(
      <p className="text-sm text-zinc-500">
        Transkript atlandı (OpenAI anahtarı veya yapılandırma).
      </p>,
    );
  }

  if (status === "pending") {
    return shell(
      <p className="text-sm text-zinc-500">
        Ses işlendikten sonra transkript oluşturulacak.
      </p>,
    );
  }

  return null;
}
