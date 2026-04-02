import { auth } from "@clerk/nextjs/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";

type Body = { password?: string | null };

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

  const passwordRaw = body.password;
  const clear =
    passwordRaw === null ||
    passwordRaw === undefined ||
    (typeof passwordRaw === "string" && passwordRaw.trim() === "");

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

  const hash = clear
    ? null
    : bcrypt.hashSync(
        typeof passwordRaw === "string" ? passwordRaw : "",
        10,
      );

  await db
    .update(videos)
    .set({
      sharePasswordHash: hash,
      updatedAt: new Date(),
    })
    .where(eq(videos.id, videoId));

  return NextResponse.json({
    ok: true,
    protected: !clear,
  });
}
