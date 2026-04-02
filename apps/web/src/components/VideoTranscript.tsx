"use client";

type Props = {
  status: string | null;
  text: string | null;
  error: string | null;
};

export function VideoTranscript({ status, text, error }: Props) {
  if (status === "ready" && text) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-2 text-sm font-medium text-zinc-400">Transcript</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {text}
        </p>
      </section>
    );
  }

  if (status === "processing") {
    return (
      <p className="text-sm text-zinc-500">Transcript hazırlanıyor…</p>
    );
  }

  if (status === "error" && error) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        Transcript hatası: {error}
      </p>
    );
  }

  if (status === "skipped") {
    return (
      <p className="text-sm text-zinc-500">
        Transcript atlandı (OpenAI anahtarı veya yapılandırma).
      </p>
    );
  }

  if (status === "pending") {
    return (
      <p className="text-sm text-zinc-500">
        Ses dosyası işlendikten sonra transcript oluşturulacak.
      </p>
    );
  }

  return null;
}
