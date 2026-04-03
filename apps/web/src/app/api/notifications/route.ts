import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { userNotifications, videos } from "@/lib/db/schema";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const rows = await getDb()
    .select({
      id: userNotifications.id,
      type: userNotifications.type,
      title: userNotifications.title,
      body: userNotifications.body,
      readAt: userNotifications.readAt,
      createdAt: userNotifications.createdAt,
      videoId: userNotifications.videoId,
      shareSlug: videos.shareSlug,
    })
    .from(userNotifications)
    .innerJoin(videos, eq(videos.id, userNotifications.videoId))
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(80);

  return NextResponse.json({
    notifications: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      readAt: r.readAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      videoId: r.videoId,
      shareSlug: r.shareSlug,
    })),
  });
}
