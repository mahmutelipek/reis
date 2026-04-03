import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { videoViews } from "@/lib/db/schema";

/** Benzersiz izleyici oturumu sayısı (her session bir “görüntüleme”). */
export async function countVideoViews(videoId: string): Promise<number> {
  const [row] = await getDb()
    .select({ c: count() })
    .from(videoViews)
    .where(eq(videoViews.videoId, videoId));
  return Number(row?.c ?? 0);
}
