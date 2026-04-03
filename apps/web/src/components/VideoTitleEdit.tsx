"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  videoId: string;
  initialTitle: string;
  /** Paylaşım detay URL’si (örn. /v/abc); verilirse başlık tıklanabilir olur. */
  detailHref?: string;
  /** Kütüphane (Loom) kartı: kompakt başlık */
  variant?: "default" | "card";
};

export function VideoTitleEdit({
  videoId,
  initialTitle,
  detailHref,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setValue(initialTitle);
  }, [initialTitle, editing]);

  async function save() {
    const t = value.trim();
    if (!t || t === initialTitle) {
      setEditing(false);
      setValue(initialTitle);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      setEditing(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Hata");
      setValue(initialTitle);
    } finally {
      setBusy(false);
    }
  }

  const titleLinkClass =
    variant === "card"
      ? "min-w-0 max-w-full text-sm font-semibold text-gray-900 hover:text-blue-600 hover:underline"
      : "min-w-0 max-w-full font-medium text-foreground hover:text-blue-600 hover:underline dark:hover:text-blue-400";

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {detailHref ? (
          <Link
            href={detailHref}
            prefetch
            className={titleLinkClass}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="line-clamp-2 text-pretty">{initialTitle}</span>
          </Link>
        ) : (
          <span
            className={
              variant === "card"
                ? "text-sm font-semibold text-gray-900"
                : "font-medium text-zinc-900 dark:text-zinc-100"
            }
          >
            {initialTitle}
          </span>
        )}
        <button
          type="button"
          data-card-interactive
          onClick={(e) => {
            e.stopPropagation();
            setValue(initialTitle);
            setEditing(true);
            setErr(null);
          }}
          className={
            variant === "card"
              ? "text-[10px] text-blue-600 underline"
              : "text-xs text-blue-600 underline dark:text-blue-400"
          }
        >
          Düzenle
        </button>
        {err ? (
          <span
            className="text-xs text-red-500"
            data-card-interactive
            onClick={(e) => e.stopPropagation()}
          >
            {err}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1"
      data-card-interactive
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-[12rem] flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          disabled={busy}
        />
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          Kaydet
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(initialTitle);
            setEditing(false);
            setErr(null);
          }}
          disabled={busy}
          className="text-xs text-zinc-500 underline"
        >
          İptal
        </button>
      </div>
      {err ? <span className="text-xs text-red-500">{err}</span> : null}
    </div>
  );
}
