"use client";

import { Check, Link2, UserPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Loom tarzı üst çubuk: Paylaş + bağlantı ikonu (ikisi de URL kopyalar) */
  layout?: "default" | "loom-toolbar";
};

export function PublicShareCopyButton({ layout = "default" }: Props) {
  const [done, setDone] = useState(false);

  const copy = useCallback(async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      /* clipboard reddi — sessiz */
    }
  }, []);

  if (layout === "loom-toolbar") {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="h-9 rounded-full px-3.5 text-[14px] font-medium shadow-none"
          onClick={() => void copy()}
        >
          {done ? (
            <>
              <Check className="size-4" aria-hidden />
              Kopyalandı
            </>
          ) : (
            <>
              <UserPlus className="size-4" aria-hidden />
              Paylaş
            </>
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          className="size-[34px] rounded-full shadow-none"
          aria-label="Bağlantıyı kopyala"
          onClick={() => void copy()}
        >
          {done ? (
            <Check className="size-[18px]" aria-hidden />
          ) : (
            <Link2 className="size-[18px]" aria-hidden />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="gap-1.5"
      onClick={() => void copy()}
    >
      {done ? (
        <>
          <Check className="size-3.5" />
          Kopyalandı
        </>
      ) : (
        <>
          <Link2 className="size-3.5" />
          Bağlantıyı kopyala
        </>
      )}
    </Button>
  );
}
