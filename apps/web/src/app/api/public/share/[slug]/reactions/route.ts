import { auth } from "@clerk/nextjs/server";
import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videoReactions } from "@/lib/db/schema";
import { resolvePublicVideo } from "@/lib/public-video-access";
import { isReactionKind, type ReactionKind } from "@/lib/video-engagement";

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

  const videoId = res.video.id;
  const db = getDb();

  const rows = await db
    .select({
      kind: videoReactions.kind,
      c: count(),
    })
    .from(videoReactions)
    .where(eq(videoReactions.videoId, videoId))
    .groupBy(videoReactions.kind);

  const byKind: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    const n = Number(r.c);
    byKind[r.kind] = n;
    total += n;
  }

  const { userId } = await auth();
  let mine: ReactionKind[] = [];
  if (userId) {
    const m = await db
      .select({ kind: videoReactions.kind })
      .from(videoReactions)
      .where(
        and(
          eq(videoReactions.videoId, videoId),
          eq(videoReactions.userId, userId),
        ),
      );
    mine = m
      .map((x) => x.kind)
      .filter((k): k is ReactionKind => isReactionKind(k));
  }

  return NextResponse.json({ byKind, total, mine });
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

  let kindRaw = "";
  try {
    const j = (await req.json()) as unknown;
    if (j && typeof j === "object" && "kind" in j) {
      kindRaw =
        typeof (j as { kind: unknown }).kind === "string"
          ? (j as { kind: string }).kind
          : "";
    }
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde" }, { status: 400 });
  }

  if (!isReactionKind(kindRaw)) {
    return NextResponse.json({ error: "Geçersiz tepki" }, { status: 400 });
  }

  const videoId = res.video.id;
  const db = getDb();

  const [existing] = await db
    .select({ id: videoReactions.id })
    .from(videoReactions)
    .where(
      and(
        eq(videoReactions.videoId, videoId),
        eq(videoReactions.userId, userId),
        eq(videoReactions.kind, kindRaw),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(videoReactions)
      .where(eq(videoReactions.id, existing.id));
    return NextResponse.json({ active: false, kind: kindRaw });
  }

  await db.insert(videoReactions).values({
    videoId,
    userId,
    kind: kindRaw,
  });

  return NextResponse.json({ active: true, kind: kindRaw });
}
