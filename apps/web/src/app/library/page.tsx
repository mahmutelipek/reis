import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { and, count, desc, eq, inArray, isNull, isNotNull } from "drizzle-orm";
import {
  LibraryView,
  type LibraryVideoItem,
} from "@/components/LibraryView";
import { getDb } from "@/lib/db";
import { videos, videoViews } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";

export const dynamic = "force-dynamic";

async function loadVideosForUser(userId: string, archived: boolean) {
  const condition = archived
    ? isNotNull(videos.archivedAt)
    : isNull(videos.archivedAt);

  return getDb()
    .select()
    .from(videos)
    .where(and(eq(videos.userId, userId), condition))
    .orderBy(desc(videos.createdAt));
}

function toItems(
  list: (typeof videos.$inferSelect)[],
  viewersByVideo: Map<string, number>,
): LibraryVideoItem[] {
  return list.map((v) => ({
    id: v.id,
    title: v.title,
    status: v.status,
    shareSlug: v.shareSlug,
    transcriptStatus: v.transcriptStatus ?? null,
    sharePasswordHash: v.sharePasswordHash,
    createdAt: v.createdAt.toISOString(),
    viewers: viewersByVideo.get(v.id) ?? 0,
    muxPlaybackId: v.muxPlaybackId,
    archivedAt: v.archivedAt ? v.archivedAt.toISOString() : null,
  }));
}

export default async function LibraryPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-muted-foreground">
          Clerk yapılandırılmadı. Ortam değişkenlerini kontrol edin.
        </p>
      </div>
    );
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userDisplayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user?.username ??
        user?.primaryEmailAddress?.emailAddress ??
        "Kullanıcı");
  const userImageUrl = user?.imageUrl ?? null;

  const [activeList, archivedList] = await Promise.all([
    loadVideosForUser(userId, false),
    loadVideosForUser(userId, true),
  ]);

  const allIds = [...activeList, ...archivedList].map((v) => v.id);
  const viewCounts =
    allIds.length === 0
      ? []
      : await getDb()
          .select({
            videoId: videoViews.videoId,
            viewers: count(videoViews.id),
          })
          .from(videoViews)
          .where(inArray(videoViews.videoId, allIds))
          .groupBy(videoViews.videoId);

  const viewersByVideo = new Map(
    viewCounts.map((r) => [r.videoId, r.viewers]),
  );

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";

  return (
    <LibraryView
      activeVideos={toItems(activeList, viewersByVideo)}
      archivedVideos={toItems(archivedList, viewersByVideo)}
      appBaseUrl={appBaseUrl}
      userDisplayName={userDisplayName}
      userImageUrl={userImageUrl}
    />
  );
}
