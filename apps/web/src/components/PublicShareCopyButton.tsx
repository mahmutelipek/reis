"use client";

import { Check, Link2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

export function PublicShareCopyButton() {
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
