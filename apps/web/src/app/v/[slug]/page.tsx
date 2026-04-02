import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharePasswordGate } from "@/components/SharePasswordGate";
import { TrackedMuxPlayer } from "@/components/TrackedMuxPlayer";
import { VideoTranscript } from "@/components/VideoTranscript";
import { resolvePublicVideo } from "@/lib/public-video-access";
import { getShareSlugMeta } from "@/lib/share-page-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await getShareSlugMeta(slug);
  if (!row || row.status !== "ready") {
    return { title: "Video · Promptly" };
  }
  if (row.sharePasswordHash) {
    return {
      title: "Korumalı video · Promptly",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${row.title} · Promptly`,
    description: "Promptly ile paylaşılan async video.",
    openGraph: { title: row.title, type: "website" },
  };
}

export default async function PublicVideoPage({ params }: Props) {
  const { slug } = await params;
  const result = await resolvePublicVideo(slug);

  if (result.kind === "not_found") {
    notFound();
  }

  if (result.kind === "misconfigured") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-zinc-950 px-4 text-center text-sm text-zinc-400">
        Paylaşım şifresi etkin ancak sunucuda{" "}
        <code className="text-zinc-300">SHARE_UNLOCK_SECRET</code> tanımlı değil.
      </div>
    );
  }

  if (result.kind === "locked") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-zinc-950 px-4">
        <SharePasswordGate shareSlug={slug} title={result.video.title} />
      </div>
    );
  }

  const { video } = result;

  return (
    <div className="min-h-svh bg-zinc-950 px-4 py-10 text-zinc-50">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{video.title}</h1>
        <TrackedMuxPlayer
          shareSlug={slug}
          playbackId={video.muxPlaybackId!}
          title={video.title}
        />
        <VideoTranscript
          status={video.transcriptStatus ?? "pending"}
          text={video.transcriptText}
          error={video.transcriptError}
        />
      </div>
    </div>
  );
}
