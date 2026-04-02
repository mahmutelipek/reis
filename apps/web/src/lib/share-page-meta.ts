import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";

/**
 * OG / başlık için; cookie kullanmaz. Kilitli videoda gerçek başlık sızdırılmaz.
 */
export async function getShareSlugMeta(shareSlug: string) {
  const [row] = await getDb()
    .select({
      title: videos.title,
      status: videos.status,
      sharePasswordHash: videos.sharePasswordHash,
    })
    .from(videos)
    .where(eq(videos.shareSlug, shareSlug))
    .limit(1);

  return row ?? null;
}
