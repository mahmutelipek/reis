import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videos, videoViews } from "@/lib/db/schema";

const SESSION_MAX_LEN = 80;

type Body = {
  shareSlug?: string;
  sessionId?: string;
  seconds?: number;
};

function clampSeconds(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 86400);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shareSlug =
    typeof body.shareSlug === "string" ? body.shareSlug.trim() : "";
  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const seconds = clampSeconds(
    typeof body.seconds === "number" ? body.seconds : 0,
  );

  if (!shareSlug || shareSlug.length > 64) {
    return NextResponse.json({ error: "Invalid shareSlug" }, { status: 400 });
  }
  if (
    !sessionId ||
    sessionId.length > SESSION_MAX_LEN ||
    !/^[a-zA-Z0-9_-]+$/.test(sessionId)
  ) {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  const db = getDb();
  const [video] = await db
    .select({ id: videos.id })
    .from(videos)
    .where(
      and(eq(videos.shareSlug, shareSlug), eq(videos.status, "ready")),
    )
    .limit(1);

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const [existing] = await db
    .select()
    .from(videoViews)
    .where(
      and(
        eq(videoViews.videoId, video.id),
        eq(videoViews.sessionId, sessionId),
      ),
    )
    .limit(1);

  if (existing) {
    const nextMax = Math.max(existing.maxSecondsWatched, seconds);
    await db
      .update(videoViews)
      .set({
        maxSecondsWatched: nextMax,
        updatedAt: now,
      })
      .where(eq(videoViews.id, existing.id));
  } else {
    await db.insert(videoViews).values({
      videoId: video.id,
      sessionId,
      maxSecondsWatched: seconds,
      createdAt: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}
