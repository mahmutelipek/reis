"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { videoId: string };

export function VideoMuxSyncButton({ videoId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/videos/${videoId}/sync-mux`, {
        method: "POST",
      });
      const j = (await res.json()) as {
        sync?: { outcome?: string; reason?: string };
        error?: string;
      };
      if (!res.ok) {
        setMsg(j.error ?? "İstek başarısız");
        return;
      }
      const o = j.sync?.outcome;
      if (o === "updated_ready") {
        setMsg("Video hazır — sayfa yenileniyor.");
      } else if (o === "marked_error") {
        setMsg(j.sync?.reason ?? "İşleme hatası");
      } else if (o === "still_processing") {
        setMsg("Mux hâlâ işliyor; biraz sonra tekrar dene.");
      } else if (o === "already_ready") {
        setMsg("Zaten hazırdı.");
      } else {
        setMsg("Durum kontrol edildi.");
      }
      router.refresh();
    } catch {
      setMsg("Ağ hatası");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => void run()}
      >
        {busy ? "Mux sorgulanıyor…" : "Mux’tan senkronize et"}
      </Button>
      {msg ? (
        <p className="max-w-md text-center text-xs text-zinc-500">{msg}</p>
      ) : null}
    </div>
  );
}
