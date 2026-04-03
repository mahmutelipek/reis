import { auth, currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { clerkDisplayName } from "@/lib/clerk-display-name";
import { getDb } from "@/lib/db";
import { videoComments } from "@/lib/db/schema";
import { resolvePublicVideo } from "@/lib/public-video-access";
import { notifyVideoOwnerComment } from "@/lib/video-engagement";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const res = await resolvePublicVideo(slug);
  if (res.kind !== "ok") {
    return NextResponse.json(
      { error: "Video yok veya erişilemez" },
      { status: 404 },
    );
  }

  const rows = await getDb()
    .select({
      id: videoComments.id,
      authorName: videoComments.authorName,
      body: videoComments.body,
      createdAt: videoComments.createdAt,
    })
    .from(videoComments)
    .where(eq(videoComments.videoId, res.video.id))
    .orderBy(desc(videoComments.createdAt))
    .limit(200);

  return NextResponse.json({
    comments: rows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { slug } = await ctx.params;
  const res = await resolvePublicVideo(slug);
  if (res.kind !== "ok") {
    return NextResponse.json(
      { error: "Video yok veya erişilemez" },
      { status: 404 },
    );
  }

  let body = "";
  try {
    const j = (await req.json()) as unknown;
    if (j && typeof j === "object" && "body" in j) {
      body = typeof (j as { body: unknown }).body === "string"
        ? (j as { body: string }).body.trim()
        : "";
    }
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde" }, { status: 400 });
  }

  if (body.length < 1 || body.length > 2000) {
    return NextResponse.json(
      { error: "Yorum 1–2000 karakter olmalı" },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const authorName = clerkDisplayName(user);

  const db = getDb();
  const [inserted] = await db
    .insert(videoComments)
    .values({
      videoId: res.video.id,
      userId,
      authorName,
      body,
    })
    .returning({ id: videoComments.id });

  if (res.video.userId !== userId) {
    await notifyVideoOwnerComment({
      ownerUserId: res.video.userId,
      videoId: res.video.id,
      actorName: authorName,
      preview: body,
    });
  }

  return NextResponse.json({ ok: true, id: inserted?.id });
}
