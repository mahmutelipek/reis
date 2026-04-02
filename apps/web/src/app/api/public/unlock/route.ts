import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import {
  SHARE_UNLOCK_COOKIE,
  createShareUnlockToken,
  isShareUnlockConfigured,
} from "@/lib/share-unlock-token";

type Body = { shareSlug?: string; password?: string };

export async function POST(req: Request) {
  if (!isShareUnlockConfigured()) {
    return NextResponse.json(
      { error: "Share unlock is not configured (SHARE_UNLOCK_SECRET)" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shareSlug =
    typeof body.shareSlug === "string" ? body.shareSlug.trim() : "";
  const password =
    typeof body.password === "string" ? body.password : "";

  if (!shareSlug || !password) {
    return NextResponse.json(
      { error: "shareSlug and password required" },
      { status: 400 },
    );
  }

  const [video] = await getDb()
    .select({
      id: videos.id,
      status: videos.status,
      sharePasswordHash: videos.sharePasswordHash,
    })
    .from(videos)
    .where(eq(videos.shareSlug, shareSlug))
    .limit(1);

  if (!video || video.status !== "ready" || !video.sharePasswordHash) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = bcrypt.compareSync(password, video.sharePasswordHash);
  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = createShareUnlockToken(shareSlug);
  if (!token) {
    return NextResponse.json({ error: "Token error" }, { status: 500 });
  }

  const jar = await cookies();
  jar.set(SHARE_UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
