import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";

/**
 * İndirilebilir public Mux ses dosyasından OpenAI Whisper ile metin çıkarır.
 * `OPENAI_API_KEY` yoksa veya hata olursa satırı günceller; sessizce çıkmaz (status/error).
 */
export async function transcribeVideoFromMuxAudioUrl(
  videoId: string,
  audioUrl: string,
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  const db = getDb();

  if (!apiKey?.trim()) {
    await db
      .update(videos)
      .set({
        transcriptStatus: "skipped",
        transcriptError: "OPENAI_API_KEY tanımlı değil",
        updatedAt: new Date(),
      })
      .where(eq(videos.id, videoId));
    return;
  }

  await db
    .update(videos)
    .set({
      transcriptStatus: "processing",
      transcriptError: null,
      updatedAt: new Date(),
    })
    .where(eq(videos.id, videoId));

  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      throw new Error(`Mux ses indirilemedi: ${audioRes.status}`);
    }
    const buf = Buffer.from(await audioRes.arrayBuffer());
    if (buf.length < 64) {
      throw new Error("Ses dosyası çok kısa veya boş");
    }

    const form = new FormData();
    form.append(
      "file",
      new File([buf], "audio.m4a", { type: "audio/mp4" }),
    );
    form.append("model", "whisper-1");
    form.append("response_format", "json");

    const lang = process.env.TRANSCRIPT_DEFAULT_LANGUAGE?.trim();
    if (lang) form.append("language", lang);

    const trRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!trRes.ok) {
      const errBody = await trRes.text();
      throw new Error(`Whisper HTTP ${trRes.status}: ${errBody.slice(0, 300)}`);
    }

    const data = (await trRes.json()) as { text?: string };
    const text = data.text?.trim();
    if (!text) {
      throw new Error("Whisper boş metin döndü");
    }

    await db
      .update(videos)
      .set({
        transcriptStatus: "ready",
        transcriptText: text,
        transcriptError: null,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, videoId));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db
      .update(videos)
      .set({
        transcriptStatus: "error",
        transcriptError: message,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, videoId));
  }
}
