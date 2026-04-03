"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  status: string | null;
  text: string | null;
  error: string | null;
  /** Geniş ekranda sağ sütun: yapışkan panel + kaydırılabilir metin */
  variant?: "default" | "sidebar";
  /** Açık tema (Loom tarzı paylaşım sayfası) */
  tone?: "dark" | "light";
};

export function VideoTranscript({
  status,
  text,
  error,
  variant = "default",
  tone = "dark",
}: Props) {
  const isSidebar = variant === "sidebar";
  const isLight = tone === "light";
  const shell = (children: ReactNode) => (
    <section
      className={cn(
        "p-4",
        isLight
          ? "border border-gray-200 bg-white"
          : "border border-zinc-800 bg-zinc-900/50",
        isSidebar
          ? cn(
              "flex max-h-[min(70vh,560px)] flex-col rounded-xl",
              !isLight && "lg:sticky lg:top-8",
            )
          : "rounded-lg",
      )}
    >
      {children}
    </section>
  );

  const headingClass = isLight
    ? "shrink-0 text-sm font-medium text-gray-500"
    : "shrink-0 text-sm font-medium text-zinc-400";
  const bodyReadyClass = isLight
    ? "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800"
    : "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200";
  const mutedClass = isLight ? "text-sm text-gray-500" : "text-sm text-zinc-500";
  const errClass = isLight
    ? "text-sm text-amber-700"
    : "text-sm text-amber-600 dark:text-amber-400";

  if (status === "ready" && text) {
    return shell(
      <>
        <h2 className={headingClass}>Transkript</h2>
        <p
          className={cn(
            bodyReadyClass,
            isSidebar && "min-h-0 flex-1 overflow-y-auto pr-1",
          )}
        >
          {text}
        </p>
      </>,
    );
  }

  if (status === "processing") {
    return shell(<p className={mutedClass}>Transkript hazırlanıyor…</p>);
  }

  if (status === "error" && error) {
    return shell(
      <p className={errClass}>Transkript hatası: {error}</p>,
    );
  }

  if (status === "skipped") {
    return shell(
      <p className={mutedClass}>
        Transkript atlandı (OpenAI anahtarı veya yapılandırma).
      </p>,
    );
  }

  if (status === "pending") {
    return shell(
      <p className={mutedClass}>
        Ses işlendikten sonra transkript oluşturulacak.
      </p>,
    );
  }

  return null;
}
