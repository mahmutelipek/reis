"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DesktopSessionTokenPanel({ token }: { token: string }) {
  const [hint, setHint] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setHint("Panoya kopyalandı.");
      window.setTimeout(() => setHint(null), 2500);
    } catch {
      setHint("Kopyalanamadı; metni elle seçip kopyala.");
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Yedek: oturum jetonu (elle yapıştır)
      </label>
      <textarea
        readOnly
        value={token}
        rows={6}
        className="w-full resize-y rounded-lg border border-input bg-muted/30 p-3 font-mono text-xs leading-relaxed break-all"
        spellCheck={false}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => void copy()}>
          Kopyala
        </Button>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}
