import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import type { Video } from "@/lib/db/schema";
import { videos } from "@/lib/db/schema";
import {
  SHARE_UNLOCK_COOKIE,
  isShareUnlockConfigured,
  verifyShareUnlockToken,
} from "@/lib/share-unlock-token";

export type PublicVideoResult =
  | { kind: "not_found" }
  | { kind: "misconfigured"; video: Video }
  | { kind: "locked"; video: Video }
  | { kind: "ok"; video: Video };

export async function resolvePublicVideo(
  shareSlug: string,
): Promise<PublicVideoResult> {
  const [video] = await getDb()
    .select()
    .from(videos)
    .where(eq(videos.shareSlug, shareSlug))
    .limit(1);

  if (!video || video.status !== "ready" || !video.muxPlaybackId) {
    return { kind: "not_found" };
  }

  const locked = !!video.sharePasswordHash;
  const jar = await cookies();
  const token = jar.get(SHARE_UNLOCK_COOKIE)?.value;
  const unlocked = !locked || verifyShareUnlockToken(shareSlug, token);

  if (locked && !isShareUnlockConfigured()) {
    return { kind: "misconfigured", video };
  }

  if (locked && !unlocked) {
    return { kind: "locked", video };
  }

  return { kind: "ok", video };
}
