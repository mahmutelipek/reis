import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";
import { syncVideoRowFromMux } from "@/lib/sync-video-from-mux";

type Ctx = { params: Promise<{ videoId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { error: "Clerk is not configured" },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await ctx.params;
  const db = getDb();
  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);

  if (!video || video.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await syncVideoRowFromMux(video);

  const [fresh] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);

  return NextResponse.json({ sync: result, video: fresh ?? video });
}
