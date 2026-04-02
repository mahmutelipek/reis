"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { videoId: string };

export function RetranscribeButton({ videoId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/videos/${videoId}/transcribe`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      setMsg("Arka planda başlatıldı; bir süre sonra yenileyin.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="w-fit rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
      >
        {busy ? "Gönderiliyor…" : "Transcript’i yeniden dene"}
      </button>
      {msg ? <span className="text-xs text-zinc-500">{msg}</span> : null}
    </div>
  );
}
