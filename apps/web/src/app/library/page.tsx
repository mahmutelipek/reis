import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
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
import { videos } from "@/lib/db/schema";
import { isClerkConfigured } from "@/lib/clerk-config";

export const dynamic = "force-dynamic";

async function loadVideosForUser(userId: string) {
  return getDb()
    .select()
    .from(videos)
    .where(and(eq(videos.userId, userId), isNull(videos.archivedAt)))
    .orderBy(desc(videos.createdAt));
}

function toItems(list: (typeof videos.$inferSelect)[]): LibraryVideoItem[] {
  return list.map((v) => ({
    id: v.id,
    title: v.title,
    status: v.status,
    shareSlug: v.shareSlug,
    createdAt: v.createdAt.toISOString(),
    durationSeconds: v.durationSeconds ?? null,
    muxPlaybackId: v.muxPlaybackId,
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

  const list = await loadVideosForUser(userId);

  return (
    <LibraryView
      videos={toItems(list)}
      userDisplayName={userDisplayName}
      userImageUrl={userImageUrl}
    />
  );
}
