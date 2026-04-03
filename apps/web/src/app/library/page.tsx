import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm";
import {
  LibraryView,
  type LibraryVideoItem,
} from "@/components/LibraryView";
import { clerkDisplayName } from "@/lib/clerk-display-name";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDb } from "@/lib/db";
import {
  videoComments,
  videoReactions,
  videos,
  videoViews,
} from "@/lib/db/schema";
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
  commentCountByVideo: Map<string, number>,
  reactionCountByVideo: Map<string, number>,
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
    commentCount: commentCountByVideo.get(v.id) ?? 0,
    reactionCount: reactionCountByVideo.get(v.id) ?? 0,
    durationSeconds: v.durationSeconds ?? null,
    muxPlaybackId: v.muxPlaybackId,
    archivedAt: v.archivedAt ? v.archivedAt.toISOString() : null,
  }));
}

export default async function LibraryPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Clerk yapılandırılmadı</CardTitle>
            <CardDescription>
              Tam deneyim için ortam değişkenlerini doldurman gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                apps/web/.env.example
              </code>{" "}
              dosyasını{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              olarak kopyala;{" "}
              <strong className="text-foreground">Clerk</strong> ve{" "}
              <strong className="text-foreground">DATABASE_URL</strong> anahtarlarını
              ekle. Ardından{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                npm run dev
              </code>{" "}
              ile yeniden başlat.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const userDisplayName = clerkDisplayName(user);
  const userImageUrl = user?.imageUrl ?? null;

  const [activeList, archivedList] = await Promise.all([
    loadVideosForUser(userId, false),
    loadVideosForUser(userId, true),
  ]);

  const allIds = [...activeList, ...archivedList].map((v) => v.id);
  const [viewCounts, commentCounts, reactionCounts] =
    allIds.length === 0
      ? [[], [], []]
      : await Promise.all([
          getDb()
            .select({
              videoId: videoViews.videoId,
              viewers: count(videoViews.id),
            })
            .from(videoViews)
            .where(inArray(videoViews.videoId, allIds))
            .groupBy(videoViews.videoId),
          getDb()
            .select({
              videoId: videoComments.videoId,
              c: count(videoComments.id),
            })
            .from(videoComments)
            .where(inArray(videoComments.videoId, allIds))
            .groupBy(videoComments.videoId),
          getDb()
            .select({
              videoId: videoReactions.videoId,
              c: count(videoReactions.id),
            })
            .from(videoReactions)
            .where(inArray(videoReactions.videoId, allIds))
            .groupBy(videoReactions.videoId),
        ]);

  const viewersByVideo = new Map(
    viewCounts.map((r) => [r.videoId, r.viewers]),
  );
  const commentCountByVideo = new Map(
    commentCounts.map((r) => [r.videoId, r.c]),
  );
  const reactionCountByVideo = new Map(
    reactionCounts.map((r) => [r.videoId, r.c]),
  );

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";

  return (
    <LibraryView
      activeVideos={toItems(
        activeList,
        viewersByVideo,
        commentCountByVideo,
        reactionCountByVideo,
      )}
      archivedVideos={toItems(
        archivedList,
        viewersByVideo,
        commentCountByVideo,
        reactionCountByVideo,
      )}
      appBaseUrl={appBaseUrl}
      userDisplayName={userDisplayName}
      userImageUrl={userImageUrl}
    />
  );
}
