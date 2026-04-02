import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { after, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";
import { transcribeVideoFromMuxAudioUrl } from "@/lib/transcribe";

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

  if (video.status !== "ready" || !video.muxPlaybackId) {
    return NextResponse.json(
      { error: "Video is not ready for transcription" },
      { status: 400 },
    );
  }

  const audioUrl = `https://stream.mux.com/${video.muxPlaybackId}/audio.m4a`;

  after(async () => {
    await transcribeVideoFromMuxAudioUrl(video.id, audioUrl);
  });

  return NextResponse.json({
    ok: true,
    message: "Transcription started in background",
  });
}
