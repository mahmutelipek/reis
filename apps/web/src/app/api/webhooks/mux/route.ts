import Mux from "@mux/mux-node";
import { eq } from "drizzle-orm";
import { after, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { transcribeVideoFromMuxAudioUrl } from "@/lib/transcribe";

type MuxWebhookPayload = {
  type: string;
  object?: { id?: string; type?: string };
  data?: {
    id?: string;
    playback_ids?: { id: string }[];
    passthrough?: string;
    name?: string;
    resolution?: string;
    ext?: string;
  };
};

/** Çoğu video olayında asset kimliği `object.id` içindedir (`type` genelde `asset`). */
function muxAssetIdFromPayload(payload: MuxWebhookPayload): string | undefined {
  const o = payload.object;
  if (o?.id && (o.type === "asset" || o.type === "live_stream")) {
    return o.id;
  }
  return undefined;
}

async function resolveVideoForStaticRendition(event: MuxWebhookPayload) {
  let videoId: string | undefined;
  try {
    if (event.data?.passthrough) {
      const p = JSON.parse(event.data.passthrough) as { videoId?: string };
      videoId = p.videoId;
    }
  } catch {
    /* ignore */
  }

  if (videoId) {
    const [v] = await getDb()
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);
    if (v) return v;
  }

  const assetId = muxAssetIdFromPayload(event);
  if (assetId) {
    const [v] = await getDb()
      .select()
      .from(videos)
      .where(eq(videos.muxAssetId, assetId))
      .limit(1);
    return v ?? null;
  }

  return null;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const hdrs = await headers();
  const headerRecord: Record<string, string> = {};
  hdrs.forEach((value, key) => {
    headerRecord[key] = value;
  });

  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "MUX_WEBHOOK_SECRET is not set" },
      { status: 503 },
    );
  }

  const mux = new Mux();

  try {
    mux.webhooks.verifySignature(raw, headerRecord, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as MuxWebhookPayload;

  if (event.type === "video.asset.ready" && event.data) {
    const asset = event.data;
    const playbackId = asset.playback_ids?.[0]?.id;
    let videoId: string | undefined;
    try {
      if (asset.passthrough) {
        const p = JSON.parse(asset.passthrough) as { videoId?: string };
        videoId = p.videoId;
      }
    } catch {
      /* ignore invalid passthrough */
    }

    if (videoId && playbackId && asset.id) {
      await getDb()
        .update(videos)
        .set({
          status: "ready",
          muxAssetId: asset.id,
          muxPlaybackId: playbackId,
          transcriptStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(videos.id, videoId));
    }
  }

  if (event.type === "video.asset.static_rendition.ready" && event.data) {
    const fileName = event.data.name;
    const isAudioRendition =
      fileName === "audio.m4a" ||
      event.data.resolution === "audio-only" ||
      event.data.ext === "m4a";

    if (isAudioRendition && fileName) {
      const video = await resolveVideoForStaticRendition(event);
      if (video?.muxPlaybackId) {
        const audioUrl = `https://stream.mux.com/${video.muxPlaybackId}/${fileName}`;
        const vid = video.id;
        after(async () => {
          await transcribeVideoFromMuxAudioUrl(vid, audioUrl);
        });
      }
    }
  }

  if (event.type === "video.asset.errored" && event.data) {
    let videoId: string | undefined;
    try {
      if (event.data.passthrough) {
        const p = JSON.parse(event.data.passthrough) as { videoId?: string };
        videoId = p.videoId;
      }
    } catch {
      /* ignore */
    }
    if (videoId) {
      await getDb()
        .update(videos)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(videos.id, videoId));
    } else if (event.data.id) {
      await getDb()
        .update(videos)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(videos.muxAssetId, event.data.id));
    }
  }

  if (event.type === "video.upload.cancelled" && event.data?.id) {
    await getDb()
      .update(videos)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(videos.muxUploadId, event.data.id));
  }

  return NextResponse.json({ received: true });
}
