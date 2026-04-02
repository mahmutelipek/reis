"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { shareSlug: string; title: string };

export function SharePasswordGate({ shareSlug, title }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/public/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareSlug, password }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Bu video şifreyle korunuyor.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "…" : "İzle"}
        </button>
      </form>
    </div>
  );
}
