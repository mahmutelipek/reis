import Mux from "@mux/mux-node";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { Video } from "@/lib/db/schema";
import { videos } from "@/lib/db/schema";

export type SyncMuxResult =
  | { outcome: "already_ready" }
  | { outcome: "updated_ready" }
  | { outcome: "still_processing" }
  | { outcome: "marked_error"; reason?: string }
  | { outcome: "skipped"; reason: "no_mux_upload" | "mux_env_missing" };

/**
 * Webhook kaçırıldıysa veya gecikiyorsa Mux API’den durumu çekip DB’yi günceller.
 */
export async function syncVideoRowFromMux(video: Video): Promise<SyncMuxResult> {
  if (video.status === "ready" && video.muxPlaybackId) {
    return { outcome: "already_ready" };
  }

  if (!video.muxUploadId) {
    return { outcome: "skipped", reason: "no_mux_upload" };
  }

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    return { outcome: "skipped", reason: "mux_env_missing" };
  }

  const mux = new Mux({ tokenId, tokenSecret });

  let upload;
  try {
    upload = await mux.video.uploads.retrieve(video.muxUploadId);
  } catch {
    return { outcome: "still_processing" };
  }

  if (
    upload.status === "errored" ||
    upload.status === "cancelled" ||
    upload.status === "timed_out"
  ) {
    const reason =
      upload.error?.message ?? `Yükleme: ${upload.status}`;
    await getDb()
      .update(videos)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(videos.id, video.id));
    return { outcome: "marked_error", reason };
  }

  if (upload.status === "waiting") {
    return { outcome: "still_processing" };
  }

  if (upload.status !== "asset_created" || !upload.asset_id) {
    return { outcome: "still_processing" };
  }

  let asset;
  try {
    asset = await mux.video.assets.retrieve(upload.asset_id);
  } catch {
    return { outcome: "still_processing" };
  }

  await getDb()
    .update(videos)
    .set({ muxAssetId: asset.id, updatedAt: new Date() })
    .where(eq(videos.id, video.id));

  if (asset.status === "errored") {
    const reason =
      asset.errors?.messages?.join(", ") ??
      asset.errors?.type ??
      "Mux asset hatası";
    await getDb()
      .update(videos)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(videos.id, video.id));
    return { outcome: "marked_error", reason };
  }

  if (asset.status !== "ready") {
    return { outcome: "still_processing" };
  }

  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) {
    return { outcome: "still_processing" };
  }

  await getDb()
    .update(videos)
    .set({
      status: "ready",
      muxAssetId: asset.id,
      muxPlaybackId: playbackId,
      transcriptStatus: "pending",
      updatedAt: new Date(),
    })
    .where(eq(videos.id, video.id));

  return { outcome: "updated_ready" };
}
