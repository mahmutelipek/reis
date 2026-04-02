"use client";

import { useState } from "react";

type Props = {
  shareSlug: string;
  /** Tam kök URL, örn. https://app.example.com */
  baseUrl: string;
};

export function EmbedSnippet({ shareSlug, baseUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const origin = baseUrl.replace(/\/$/, "");
  const src = `${origin}/v/${shareSlug}/embed`;
  const code = `<iframe src="${src}" width="560" height="315" style="max-width:100%;border:0;border-radius:8px" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!origin) {
    return (
      <p className="text-xs text-amber-700 dark:text-amber-400">
        Embed için <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_APP_URL</code>{" "}
        tanımlayın.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Gömme kodu</p>
      <pre className="max-h-24 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-2 text-[10px] leading-relaxed text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        {code}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
      >
        {copied ? "Kopyalandı" : "Kopyala"}
      </button>
      <p className="text-[10px] text-zinc-500">
        Şifreli videolar bazı sitelerde iframe çerez kısıtları nedeniyle açılamayabilir.
      </p>
    </div>
  );
}
