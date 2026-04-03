import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { PublicShareCopyButton } from "@/components/PublicShareCopyButton";
import { RouterRefreshInterval } from "@/components/RouterRefreshInterval";
import { SharePasswordGate } from "@/components/SharePasswordGate";
import { TrackedMuxPlayer } from "@/components/TrackedMuxPlayer";
import { VideoMuxSyncButton } from "@/components/VideoMuxSyncButton";
import { VideoTranscript } from "@/components/VideoTranscript";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getUploaderDisplay } from "@/lib/clerk-uploader-display";
import { resolvePublicVideo } from "@/lib/public-video-access";
import { formatRelativeTimeTr } from "@/lib/relative-time-tr";
import { getShareSlugMeta } from "@/lib/share-page-meta";
import { countVideoViews } from "@/lib/video-view-count";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function authorInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0]! + p[p.length - 1]![0]!).toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await getShareSlugMeta(slug);
  if (!row) {
    return { title: "Video · Promptly" };
  }
  if (row.sharePasswordHash) {
    return {
      title: "Korumalı video · Promptly",
      robots: { index: false, follow: false },
    };
  }
  if (row.status === "error") {
    return {
      title: `${row.title} · Promptly`,
      robots: { index: false, follow: false },
    };
  }
  if (row.status !== "ready") {
    return {
      title: `${row.title} · Promptly`,
      description: "Video hazırlanıyor.",
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

  if (result.kind === "processing") {
    const { video } = result;
    const { userId } = await auth();
    const owner = !!userId && userId === video.userId;

    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 px-4 py-16 text-center text-zinc-100">
        <RouterRefreshInterval ms={10000} />
        <Loader2
          className="mb-4 size-10 animate-spin text-zinc-500"
          aria-hidden
        />
        <h1 className="max-w-lg text-pretty text-xl font-semibold tracking-tight">
          {video.title}
        </h1>
        <p className="mt-3 max-w-md text-sm text-zinc-400">
          Mux videoyu işliyor. Genelde 1–3 dakika sürer; sayfa birkaç saniyede
          bir kendini yeniler. Takılı kaldıysa aşağıdaki düğmeyi dene — çoğu
          zaman sebep Mux webhook URL’sinin Vercel’de yanlış veya eksik
          olmasıdır.
        </p>
        {owner ? (
          <div className="mt-8">
            <VideoMuxSyncButton videoId={video.id} />
          </div>
        ) : (
          <p className="mt-6 text-xs text-zinc-600">
            Sahibiysen giriş yap; “Mux’tan senkronize et” görünür.
          </p>
        )}
        <Link
          href="/library"
          className="mt-10 text-sm text-blue-400 underline-offset-2 hover:underline"
        >
          Kütüphaneye dön
        </Link>
      </div>
    );
  }

  if (result.kind === "failed") {
    const { video } = result;
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-100">{video.title}</h1>
        <p className="mt-3 max-w-md text-sm text-zinc-400">
          Bu video işlenemedi. Kaydı silip yeniden yükleyebilir veya kütüphanede
          başka bir kayıt seçebilirsin.
        </p>
        <Link
          href="/library"
          className="mt-8 text-sm text-blue-400 underline-offset-2 hover:underline"
        >
          Kütüphaneye dön
        </Link>
      </div>
    );
  }

  const { video } = result;

  const [viewCount, uploader] = await Promise.all([
    countVideoViews(video.id),
    getUploaderDisplay(video.userId),
  ]);

  const createdRel = formatRelativeTimeTr(video.createdAt.toISOString());

  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar size="lg" className="size-11 shrink-0">
              {uploader.imageUrl ? (
                <AvatarImage
                  src={uploader.imageUrl}
                  alt=""
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-zinc-800 text-zinc-200">
                {authorInitials(uploader.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">
                {uploader.name}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                <span>{createdRel}</span>
                <span className="text-zinc-600" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3.5 text-zinc-500" aria-hidden />
                  {viewCount} görüntüleme
                </span>
              </p>
            </div>
          </div>
          <PublicShareCopyButton />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start">
          <div className="min-w-0 space-y-4">
            <h1 className="text-pretty text-xl font-semibold tracking-tight sm:text-2xl">
              {video.title}
            </h1>
            <TrackedMuxPlayer
              shareSlug={slug}
              playbackId={video.muxPlaybackId!}
              title={video.title}
            />
          </div>
          <aside className="min-w-0 lg:pt-1">
            <VideoTranscript
              variant="sidebar"
              status={video.transcriptStatus ?? "pending"}
              text={video.transcriptText}
              error={video.transcriptError}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
