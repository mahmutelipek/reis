import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userNotifications, videos } from "@/lib/db/schema";

export const REACTION_KINDS = [
  "heart",
  "thumbsup",
  "fire",
  "clap",
  "wave",
  "eyes",
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number];

export function isReactionKind(s: string): s is ReactionKind {
  return (REACTION_KINDS as readonly string[]).includes(s);
}

/** Public UI ve kartlar için sabit sıra. */
export const REACTION_KIND_EMOJI: Record<ReactionKind, string> = {
  heart: "❤️",
  thumbsup: "👍",
  fire: "🔥",
  clap: "👏",
  wave: "🙌",
  eyes: "👀",
};

export async function notifyVideoOwnerComment(params: {
  ownerUserId: string;
  videoId: string;
  actorName: string;
  preview: string;
}) {
  if (params.ownerUserId.length === 0) return;
  const db = getDb();
  const [v] = await db
    .select({ shareSlug: videos.shareSlug })
    .from(videos)
    .where(eq(videos.id, params.videoId))
    .limit(1);
  if (!v) return;
  await db.insert(userNotifications).values({
    userId: params.ownerUserId,
    type: "comment",
    videoId: params.videoId,
    title: "Yeni yorum",
    body: `${params.actorName}: ${params.preview.slice(0, 120)}${params.preview.length > 120 ? "…" : ""}`,
  });
}
