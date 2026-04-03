"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type MouseEvent } from "react";
import {
  Archive,
  Bell,
  ChevronDown,
  Home,
  ImageIcon,
  Library,
  MonitorPlay,
  Search,
  Settings2,
  Sparkles,
  Users,
  Video,
  Eye,
  MessageCircle,
  Smile,
} from "lucide-react";
import { LibraryUserMenu } from "@/components/LibraryUserMenu";
import { RetranscribeButton } from "@/components/RetranscribeButton";
import { VideoSharePasswordSettings } from "@/components/VideoSharePasswordSettings";
import { EmbedSnippet } from "@/components/EmbedSnippet";
import { VideoTitleEdit } from "@/components/VideoTitleEdit";
import { VideoArchiveButton } from "@/components/VideoArchiveButton";
import { VideoShareMenu } from "@/components/VideoShareMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  userDisplayName: string;
  userImageUrl: string | null;
  /** Loom tarzı kota göstergesi (üst çubuk) */
  videoQuotaMax?: number;
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

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function VideoCardLoom({
  v,
  appBaseUrl,
  archived,
  userDisplayName,
  userImageUrl,
}: {
  v: LibraryVideoItem;
  appBaseUrl: string;
  archived: boolean;
  userDisplayName: string;
  userImageUrl: string | null;
}) {
  const router = useRouter();
  const thumb =
    v.muxPlaybackId && v.status === "ready"
      ? `https://image.mux.com/${v.muxPlaybackId}/thumbnail.jpg?time=1&width=720&fit_mode=preserve`
      : null;

  const slug = v.shareSlug.trim();
  const detailHref = slug ? `/v/${slug}` : "";

  function openVideoDetail(e: MouseEvent) {
    const t = e.target as HTMLElement | null;
    if (t?.closest("[data-card-interactive]")) return;
    if (t?.closest("a[href]")) return;
    if (!detailHref) return;
    e.preventDefault();
    router.push(detailHref);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
      {detailHref ? (
        <Link
          href={detailHref}
          prefetch
          className="relative block aspect-video w-full cursor-pointer overflow-hidden rounded-t-xl bg-muted no-underline outline-offset-2 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${v.title} — videoyu aç`}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              draggable={false}
              className="h-full w-full select-none object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-200/80 via-background to-violet-200/40 dark:from-slate-800/50 dark:to-violet-950/40">
              <Video className="size-12 text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground">
                {v.status === "uploading" ? "Yükleniyor / işleniyor" : v.status}
              </span>
            </div>
          )}
          <Badge
            variant="secondary"
            className="pointer-events-none absolute right-2 bottom-2 border-0 bg-black/70 text-[11px] font-medium text-white"
          >
            {v.status === "ready" ? "Video" : "İşleniyor"}
          </Badge>
        </Link>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Geçersiz paylaşım bağlantısı
          </div>
        </div>
      )}

      {detailHref ? (
        <div className="border-b border-border/60 px-3 py-2">
          <Link
            href={detailHref}
            prefetch
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 no-underline hover:underline dark:text-blue-400"
          >
            Videoyu aç
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : null}

      <div
        className="cursor-pointer space-y-2 p-3"
        onClick={openVideoDetail}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar size="sm" className="ring-1 ring-border">
              {userImageUrl ? (
                <AvatarImage src={userImageUrl} alt="" />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {initials(userDisplayName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium text-foreground">
              {userDisplayName}
            </span>
          </div>
          <div
            className="flex shrink-0 items-center gap-1"
            data-card-interactive
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <VideoShareMenu
              shareSlug={v.shareSlug}
              appBaseUrl={appBaseUrl}
              status={v.status}
              hasPassword={!!v.sharePasswordHash}
            />
          </div>
        </div>

        <div className="min-w-0">
          <VideoTitleEdit
            videoId={v.id}
            initialTitle={v.title}
            detailHref={detailHref || undefined}
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden />
            {v.viewers}
          </span>
          <span className="inline-flex items-center gap-1 opacity-50">
            <MessageCircle className="size-3.5" aria-hidden />0
          </span>
          <span className="inline-flex items-center gap-1 opacity-50">
            <Smile className="size-3.5" aria-hidden />0
          </span>
          <span className="ml-auto text-[10px]">
            {relativeTimeTr(v.createdAt)}
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2"
          data-card-interactive
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <VideoArchiveButton videoId={v.id} archived={archived} />
          {v.status === "ready" &&
          (v.transcriptStatus === "error" ||
            v.transcriptStatus === "skipped") ? (
            <RetranscribeButton videoId={v.id} />
          ) : null}
        </div>

        <details
          className="group/details rounded-lg border border-dashed border-border/80 bg-muted/20 text-xs"
          data-card-interactive
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <summary className="cursor-pointer list-none px-2 py-1.5 font-medium text-muted-foreground marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1">
              <Settings2 className="size-3.5" />
              Şifre, embed ve transcript
            </span>
          </summary>
          <div className="space-y-3 border-t border-border/60 p-2">
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
        </details>
      </div>
    </article>
  );
}

function VideoGrid({
  items,
  appBaseUrl,
  archived,
  userDisplayName,
  userImageUrl,
}: {
  items: LibraryVideoItem[];
  appBaseUrl: string;
  archived: boolean;
  userDisplayName: string;
  userImageUrl: string | null;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
      {items.map((v) => (
        <VideoCardLoom
          key={v.id}
          v={v}
          appBaseUrl={appBaseUrl}
          archived={archived}
          userDisplayName={userDisplayName}
          userImageUrl={userImageUrl}
        />
      ))}
    </div>
  );
}

export function LibraryView({
  activeVideos,
  archivedVideos,
  appBaseUrl,
  userDisplayName,
  userImageUrl,
  videoQuotaMax = 25,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"new" | "old">("new");

  const sortedActive = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = activeVideos.filter((v) =>
      q ? v.title.toLowerCase().includes(q) : true,
    );
    list = [...list].sort((a, b) => {
      if (sortBy === "title") {
        const c = a.title.localeCompare(b.title, "tr");
        return sortOrder === "new" ? c : -c;
      }
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === "new" ? tb - ta : ta - tb;
    });
    return list;
  }, [activeVideos, search, sortBy, sortOrder]);

  const sortedArchived = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...archivedVideos]
      .filter((v) => (q ? v.title.toLowerCase().includes(q) : true))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [archivedVideos, search]);

  const quotaPct = Math.min(
    100,
    Math.round((activeVideos.length / videoQuotaMax) * 100),
  );

  return (
    <div className="flex min-h-svh w-full bg-background">
      {/* Sol şerit — Loom sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 px-3">
          <span className="font-heading text-lg font-bold tracking-tight text-sidebar-foreground">
            Promptly
          </span>
        </div>
        <div className="px-2 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              nativeButton
              className="flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-left text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/80"
            >
              <span className="truncate">Çalışma alanı</span>
              <ChevronDown className="size-4 shrink-0 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem>Varsayılan alan</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <Home className="size-4 shrink-0" />
            Ana sayfa
          </Link>
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-2.5 py-2 text-sm font-medium text-sidebar-accent-foreground">
            <Library className="size-4 shrink-0" />
            Kütüphane
          </div>
          <div className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground opacity-50">
            <MonitorPlay className="size-4 shrink-0" />
            Toplantılar
          </div>
          <div className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground opacity-50">
            <Video className="size-4 shrink-0" />
            Son izlenenler
          </div>
        </nav>

        <Separator className="my-3" />
        <p className="px-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Yönetim
        </p>
        <nav className="mt-1 flex flex-col gap-0.5 px-2">
          <div className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground opacity-50">
            <Settings2 className="size-4 shrink-0" />
            Ayarlar
          </div>
          <div className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground opacity-50">
            <Users className="size-4 shrink-0" />
            Kullanıcılar
          </div>
        </nav>

        <div className="mt-auto space-y-3 border-t border-sidebar-border p-3">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="text-xs font-medium text-sidebar-foreground">
              Ekibini davet et
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Yakında: ortak kütüphane ve klasörler.
            </p>
            <Button
              size="sm"
              className="mt-2 w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled
            >
              Davet gönder
            </Button>
          </div>
          <Button
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            title="macOS Promptly uygulamasında kayıt başlatın"
            type="button"
            onClick={() =>
              window.alert(
                "Kayıt: Promptly masaüstü uygulamasını açın (apps/desktop). API kökü ve masaüstü anahtarını ayarlayıp ekran kaydı alın.",
              )
            }
          >
            <Sparkles className="mr-2 size-4" />
            Kayıt al
          </Button>
        </div>
      </aside>

      {/* Ana sütun */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Üst bar — arama + kota + kullanıcı */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:gap-4 lg:px-6">
          <div className="relative min-w-0 flex-1 max-w-xl lg:mx-0">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Kişi, başlık veya video ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-border bg-muted/40 pl-9 shadow-none md:bg-background"
            />
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {activeVideos.length}/{videoQuotaMax} video
              </span>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden lg:inline-flex" disabled>
              Yükselt
            </Button>
            <Button variant="ghost" size="icon-sm" className="size-8" disabled aria-label="Bildirimler">
              <Bell className="size-4" />
            </Button>
          </div>
          <div className="shrink-0">
            <LibraryUserMenu />
          </div>
        </header>

        <div className="flex flex-1 flex-col px-4 py-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Kütüphane
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                Videolar
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Yeni klasör
              </Button>
              <DropdownMenu>
                <div className="flex">
                  <Button
                    size="sm"
                    className="rounded-r-none bg-blue-600 text-white hover:bg-blue-700"
                    type="button"
                    onClick={() =>
                      window.alert(
                        "Kayıt için macOS Promptly masaüstü uygulamasını kullanın.",
                      )
                    }
                  >
                    Yeni video
                  </Button>
                  <DropdownMenuTrigger
                    nativeButton
                    className="inline-flex size-8 items-center justify-center rounded-r-md border border-blue-700 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <ChevronDown className="size-4" />
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() =>
                      window.alert(
                        "Masaüstü: swift build → PromptlyDesktop. API kökü + DESKTOP_APIKEY.",
                      )
                    }
                  >
                    Masaüstü kurulumu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="videos" className="flex flex-1 flex-col gap-0">
            <TabsList variant="line" className="mb-0 h-auto w-full justify-start gap-6 border-b border-border bg-transparent p-0 pb-0">
              <TabsTrigger
                value="videos"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 data-active:border-blue-600 data-active:bg-transparent data-active:shadow-none"
              >
                <Video className="size-4" />
                Videolar
              </TabsTrigger>
              <TabsTrigger
                value="screenshots"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 data-active:border-blue-600 data-active:bg-transparent data-active:shadow-none"
              >
                <ImageIcon className="size-4" />
                Ekran görüntüleri
              </TabsTrigger>
              <TabsTrigger
                value="archive"
                className="gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 data-active:border-blue-600 data-active:bg-transparent data-active:shadow-none"
              >
                <Archive className="size-4" />
                Arşiv
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-0 flex-1 pt-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Videolar</span>{" "}
                  · {sortedActive.length} kayıt
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as "date" | "title")}
                  >
                    <SelectTrigger size="sm" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Yüklenme tarihi</SelectItem>
                      <SelectItem value="title">Başlık</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortOrder}
                    onValueChange={(v) => setSortOrder(v as "new" | "old")}
                  >
                    <SelectTrigger size="sm" className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Yeniden eskiye</SelectItem>
                      <SelectItem value="old">Eskiden yeniye</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sortedActive.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
                  <MonitorPlay className="mb-4 size-14 text-muted-foreground/40" />
                  <p className="text-base font-semibold text-foreground">
                    Henüz video yok
                  </p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Sol alttaki <strong>Kayıt al</strong> veya masaüstü uygulamasıyla
                    ekran kaydı oluşturun; yükleme otomatik veya &quot;Son kaydı
                    yükle&quot; ile gönderilir.
                  </p>
                </div>
              ) : (
                <VideoGrid
                  items={sortedActive}
                  appBaseUrl={appBaseUrl}
                  archived={false}
                  userDisplayName={userDisplayName}
                  userImageUrl={userImageUrl}
                />
              )}
            </TabsContent>

            <TabsContent value="screenshots" className="mt-0 flex-1 pt-5">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
                <ImageIcon className="mb-4 size-14 text-muted-foreground/40" />
                <p className="text-base font-semibold">Ekran görüntüleri</p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Bu sekme Loom düzenine uygun hazır; yakında tek kare yakalama
                  eklenecek.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="archive" className="mt-0 flex-1 pt-5">
              {sortedArchived.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
                  Arşiv boş. Videolar sekmesinden &quot;Arşivle&quot; ile taşıyın.
                </div>
              ) : (
                <VideoGrid
                  items={sortedArchived}
                  appBaseUrl={appBaseUrl}
                  archived
                  userDisplayName={userDisplayName}
                  userImageUrl={userImageUrl}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
