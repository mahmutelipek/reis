"use client";

import Link from "next/link";
import { Library, MonitorPlay, ImageIcon, Archive, Video } from "lucide-react";
import { LibraryUserMenu } from "@/components/LibraryUserMenu";
import { RetranscribeButton } from "@/components/RetranscribeButton";
import { VideoSharePasswordSettings } from "@/components/VideoSharePasswordSettings";
import { EmbedSnippet } from "@/components/EmbedSnippet";
import { VideoTitleEdit } from "@/components/VideoTitleEdit";
import { VideoArchiveButton } from "@/components/VideoArchiveButton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type LibraryVideoItem = {
  id: string;
  title: string;
  status: string;
  shareSlug: string;
  transcriptStatus: string | null;
  sharePasswordHash: string | null;
  createdAt: string;
  viewers: number;
  muxPlaybackId: string | null;
  archivedAt: string | null;
};

type Props = {
  activeVideos: LibraryVideoItem[];
  archivedVideos: LibraryVideoItem[];
  appBaseUrl: string;
};

function relativeTimeTr(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "Az önce";
  if (sec < 3600) return `${Math.floor(sec / 60)} dk önce`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} saat önce`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} gün önce`;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function VideoCard({
  v,
  appBaseUrl,
  archived,
}: {
  v: LibraryVideoItem;
  appBaseUrl: string;
  archived: boolean;
}) {
  const thumb =
    v.muxPlaybackId && v.status === "ready"
      ? `https://image.mux.com/${v.muxPlaybackId}/thumbnail.jpg?time=1&width=640&fit_mode=preserve`
      : null;

  return (
    <Card className="overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-500/15 via-background to-sky-500/20">
            <Video className="size-10 text-muted-foreground/60" aria-hidden />
            <span className="text-xs text-muted-foreground">
              {v.status === "ready" ? "Önizleme" : v.status}
            </span>
          </div>
        )}
      </div>
      <CardHeader className="gap-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <VideoTitleEdit videoId={v.id} initialTitle={v.title} />
          <VideoArchiveButton videoId={v.id} archived={archived} />
        </div>
        <p className="text-xs text-muted-foreground">
          {relativeTimeTr(v.createdAt)}
          {v.status === "ready" ? (
            <>
              {" · izleyici oturumu: "}
              {v.viewers}
              {v.sharePasswordHash ? " · şifreli" : ""}
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {v.status}
          </Badge>
          {v.status === "ready" ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              transcript: {v.transcriptStatus ?? "—"}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-2 pt-0">
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
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/v/${v.shareSlug}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Paylaşım sayfası
            </Link>
          </div>
        ) : null}
        {v.status === "ready" ? (
          <EmbedSnippet shareSlug={v.shareSlug} baseUrl={appBaseUrl} />
        ) : null}
      </CardContent>
      <CardFooter className="text-[10px] text-muted-foreground">
        {v.id.slice(0, 8)}…
      </CardFooter>
    </Card>
  );
}

export function LibraryView({
  activeVideos,
  archivedVideos,
  appBaseUrl,
}: Props) {
  return (
    <div className="flex min-h-svh w-full bg-background">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center px-4">
          <span className="font-heading text-lg font-semibold tracking-tight">
            Promptly
          </span>
        </div>
        <Separator />
        <nav className="flex flex-col gap-0.5 p-2">
          <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground">
            <Library className="size-4 shrink-0 opacity-80" aria-hidden />
            Kütüphane
          </div>
          <div className="flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-60">
            <MonitorPlay className="size-4 shrink-0" aria-hidden />
            Toplantılar
          </div>
          <div className="flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-60">
            <Video className="size-4 shrink-0" aria-hidden />
            İzleme listesi
          </div>
        </nav>
        <div className="mt-auto border-t border-sidebar-border p-3">
          <p className="text-[11px] leading-snug text-muted-foreground">
            Ekran kaydı yalnızca macOS masaüstü uygulamasıyla alınır.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4 md:px-6">
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
            Kütüphane
          </h1>
          <LibraryUserMenu />
        </header>

        <div className="flex-1 p-4 md:p-6">
          <Tabs defaultValue="videos" className="gap-0">
            <TabsList variant="line" className="mb-6 w-full justify-start">
              <TabsTrigger value="videos" className="gap-1.5">
                <Video className="size-4" aria-hidden />
                Videolar
              </TabsTrigger>
              <TabsTrigger value="screenshots" className="gap-1.5">
                <ImageIcon className="size-4" aria-hidden />
                Ekran görüntüleri
              </TabsTrigger>
              <TabsTrigger value="archive" className="gap-1.5">
                <Archive className="size-4" aria-hidden />
                Arşiv
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-0">
              {activeVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
                  <MonitorPlay className="mb-4 size-12 text-muted-foreground/50" />
                  <p className="max-w-md text-sm font-medium text-foreground">
                    Henüz ekran kaydı yok
                  </p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Kayıtlar{" "}
                    <strong className="text-foreground">Promptly masaüstü</strong>{" "}
                    uygulamasıyla oluşturulur. Uygulamada API kökünü ve masaüstü
                    anahtarını ayarlayıp kayıt alın; yükleme otomatik veya &quot;Son
                    kaydı yükle&quot; ile gönderilir.
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Tarayıcıdan video yükleme kapalı — sadece masaüstü kayıt.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {activeVideos.map((v) => (
                    <VideoCard
                      key={v.id}
                      v={v}
                      appBaseUrl={appBaseUrl}
                      archived={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="screenshots" className="mt-0">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
                <ImageIcon className="mb-4 size-12 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  Ekran görüntüleri yakında
                </p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Loom benzeri ayrı sekme hazır; tek kare yakalamalar için veri
                  modeli ve masaüstü akışı sonraki sürümde eklenecek.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="archive" className="mt-0">
              {archivedVideos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                  Arşivde kayıt yok. Bir videoyu listeden &quot;Arşivle&quot; ile buraya
                  taşıyabilirsiniz.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {archivedVideos.map((v) => (
                    <VideoCard
                      key={v.id}
                      v={v}
                      appBaseUrl={appBaseUrl}
                      archived
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
