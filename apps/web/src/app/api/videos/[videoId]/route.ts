import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";

type Body = { title?: string };
type Ctx = { params: Promise<{ videoId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title =
    typeof body.title === "string" ? body.title.trim().slice(0, 512) : "";

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
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

  const [updated] = await db
    .update(videos)
    .set({ title, updatedAt: new Date() })
    .where(eq(videos.id, videoId))
    .returning();

  return NextResponse.json({ video: updated });
}
