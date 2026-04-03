import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharePasswordGate } from "@/components/SharePasswordGate";
import { TrackedMuxPlayer } from "@/components/TrackedMuxPlayer";
import { resolvePublicVideo } from "@/lib/public-video-access";
import { getShareSlugMeta } from "@/lib/share-page-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await getShareSlugMeta(slug);
  if (!row || row.status !== "ready" || row.sharePasswordHash) {
    return { title: "Video · Promptly", robots: { index: false } };
  }
  return {
    title: `${row.title} (gömme) · Promptly`,
    robots: { index: false, follow: false },
  };
}

/** Minimal sayfa: Notion / Confluence / iframe gömüleri için. */
export default async function EmbedVideoPage({ params }: Props) {
  const { slug } = await params;
  const result = await resolvePublicVideo(slug);

  if (result.kind === "not_found") {
    notFound();
  }

  if (result.kind === "misconfigured") {
    return (
      <div className="flex min-h-[200px] items-center justify-center bg-black p-4 text-center text-xs text-zinc-500">
        SHARE_UNLOCK_SECRET eksik.
      </div>
    );
  }

  if (result.kind === "locked") {
    return (
      <div className="bg-zinc-950 p-2">
        <SharePasswordGate shareSlug={slug} title={result.video.title} />
      </div>
    );
  }

  if (result.kind === "processing") {
    return (
      <div className="flex min-h-[200px] items-center justify-center bg-black p-4 text-center text-xs text-zinc-400">
        Video hazırlanıyor…
      </div>
    );
  }

  if (result.kind === "failed") {
    return (
      <div className="flex min-h-[200px] items-center justify-center bg-black p-4 text-center text-xs text-zinc-500">
        Video işlenemedi.
      </div>
    );
  }

  const { video } = result;

  return (
    <div className="bg-black">
      <TrackedMuxPlayer
        shareSlug={slug}
        playbackId={video.muxPlaybackId!}
        title={video.title}
      />
    </div>
  );
}
