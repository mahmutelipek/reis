import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { count, desc, eq, inArray } from "drizzle-orm";
import { LibraryUserMenu } from "@/components/LibraryUserMenu";
import { RetranscribeButton } from "@/components/RetranscribeButton";
import { UploadPanel } from "@/components/UploadPanel";
import { VideoSharePasswordSettings } from "@/components/VideoSharePasswordSettings";
import { EmbedSnippet } from "@/components/EmbedSnippet";
import { VideoTitleEdit } from "@/components/VideoTitleEdit";
import { getDb } from "@/lib/db";
import { videos, videoViews } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-zinc-600 dark:text-zinc-400">
          Clerk yapılandırılmadı.{" "}
          <Link href="/" className="text-blue-600 underline dark:text-blue-400">
            Ana sayfa
          </Link>
        </p>
      </div>
    );
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const list = await getDb()
    .select()
    .from(videos)
    .where(eq(videos.userId, userId))
    .orderBy(desc(videos.createdAt));

  const ids = list.map((v) => v.id);
  const viewCounts =
    ids.length === 0
      ? []
      : await getDb()
          .select({
            videoId: videoViews.videoId,
            viewers: count(videoViews.id),
          })
          .from(videoViews)
          .where(inArray(videoViews.videoId, ids))
          .groupBy(videoViews.videoId);

  const viewersByVideo = new Map(
    viewCounts.map((r) => [r.videoId, r.viewers]),
  );

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Kütüphane
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Masaüstü uygulamasından yükleme yakında; şimdilik tarayıcıdan doğrudan
            yükleme yapabilirsiniz.
          </p>
        </div>
        <LibraryUserMenu />
      </header>

      <UploadPanel />

      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Henüz video yok.
          </li>
        ) : (
          list.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0 max-w-full flex-1">
                <VideoTitleEdit videoId={v.id} initialTitle={v.title} />
                <p className="text-xs text-zinc-500">
                  {v.status}
                  {v.status === "ready" ? (
                    <>
                      {" · transcript: "}
                      {v.transcriptStatus ?? "—"}
                      {" · izleyici oturumu: "}
                      {viewersByVideo.get(v.id) ?? 0}
                      {v.sharePasswordHash ? " · şifreli paylaşım" : ""}
                      {" · "}
                      <Link
                        href={`/v/${v.shareSlug}`}
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        Paylaşım linki
                      </Link>
                    </>
                  ) : null}
                </p>
                {v.status === "ready" &&
                (v.transcriptStatus === "error" ||
                  v.transcriptStatus === "skipped") ? (
                  <RetranscribeButton videoId={v.id} />
                ) : null}
                {v.status === "ready" ? (
                  <VideoSharePasswordSettings
                    videoId={v.id}
                    hasPassword={!!v.sharePasswordHash}
                  />
                ) : null}
                {v.status === "ready" ? (
                  <EmbedSnippet shareSlug={v.shareSlug} baseUrl={appBaseUrl} />
                ) : null}
              </div>
              <span className="text-xs uppercase text-zinc-400">{v.id.slice(0, 8)}…</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
