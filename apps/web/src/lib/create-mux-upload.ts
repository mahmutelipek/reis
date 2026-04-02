import Mux from "@mux/mux-node";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";

const corsOrigin =
  process.env.MUX_CORS_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "*";

export type MuxUploadInitResult = {
  uploadId: string;
  url: string;
  videoId: string;
  shareSlug: string;
};

/**
 * Clerk veya masaüstü API’sinden çağrılır; DB satırı + Mux direct upload URL üretir.
 */
export async function createMuxDirectUploadForUser(params: {
  userId: string;
  title?: string;
}): Promise<MuxUploadInitResult> {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error("MUX_TOKEN_ID / MUX_TOKEN_SECRET missing");
  }

  const title =
    typeof params.title === "string" && params.title.trim()
      ? params.title.trim().slice(0, 512)
      : "Untitled";

  const mux = new Mux({ tokenId, tokenSecret });
  const shareSlug = nanoid(12);
  const userId = params.userId;

  const [row] = await getDb()
    .insert(videos)
    .values({
      userId,
      title,
      status: "uploading",
      shareSlug,
    })
    .returning();

  if (!row) {
    throw new Error("Could not create video row");
  }

  const passthrough = JSON.stringify({ videoId: row.id, userId });
  if (passthrough.length > 255) {
    await getDb().delete(videos).where(eq(videos.id, row.id));
    throw new Error("passthrough too long for Mux (max 255 chars)");
  }

  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policies: ["public"],
      passthrough,
      static_renditions: [{ resolution: "audio-only" }],
    },
  });

  await getDb()
    .update(videos)
    .set({ muxUploadId: upload.id, updatedAt: new Date() })
    .where(eq(videos.id, row.id));

  return {
    uploadId: upload.id,
    url: upload.url,
    videoId: row.id,
    shareSlug: row.shareSlug,
  };
}
