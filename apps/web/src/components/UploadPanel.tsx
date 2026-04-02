"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadPanel() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Bir video dosyası seçin.");
      return;
    }
    setBusy(true);
    try {
      const create = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || undefined }),
      });
      if (!create.ok) {
        const j = (await create.json()) as { error?: string };
        throw new Error(j.error ?? create.statusText);
      }
      const { url } = (await create.json()) as { url: string };
      const put = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "video/mp4" },
      });
      if (!put.ok) {
        throw new Error(`Mux yükleme başarısız: ${put.status}`);
      }
      setTitle("");
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme hatası");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Dosya yükle (Mux Direct Upload)
      </p>
      <input
        type="text"
        placeholder="Başlık (isteğe bağlı)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:text-white"
      />
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Yükleniyor…" : "Yükle"}
      </button>
    </form>
  );
}
