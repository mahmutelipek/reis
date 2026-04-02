"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { videoId: string; hasPassword: boolean };

export function VideoSharePasswordSettings({
  videoId,
  hasPassword,
}: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next = password.trim();
    if (!next) {
      setMsg("Şifre boş olamaz (kaldırmak için «Kaldır»).");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/videos/${videoId}/share-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: next }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      setPassword("");
      setMsg("Kaydedildi.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  async function clearPassword() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/videos/${videoId}/share-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: null }),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 80));
      setMsg("Şifre kaldırıldı.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-2 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Paylaşım şifresi {hasPassword ? " (aktif)" : " (yok)"}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={hasPassword ? "Yeni şifre" : "Şifre belirle"}
          className="min-w-[140px] flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={busy || !password.trim()}
          className="rounded bg-zinc-800 px-2 py-1 text-xs text-white disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900"
        >
          Kaydet
        </button>
        {hasPassword ? (
          <button
            type="button"
            disabled={busy}
            onClick={clearPassword}
            className="rounded border border-zinc-400 px-2 py-1 text-xs dark:border-zinc-500"
          >
            Kaldır
          </button>
        ) : null}
      </div>
      {msg ? <p className="text-xs text-zinc-500">{msg}</p> : null}
    </form>
  );
}
