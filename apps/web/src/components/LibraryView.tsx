"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Disc,
  HelpCircle,
  ImageIcon,
  Library,
  Menu,
  MonitorPlay,
  Search,
  Settings2,
  Video,
  Eye,
  MessageCircle,
  Smile,
} from "lucide-react";
import { LibraryNotificationsMenu } from "@/components/LibraryNotificationsMenu";
import { LibraryUserMenu } from "@/components/LibraryUserMenu";
import { RetranscribeButton } from "@/components/RetranscribeButton";
import { VideoSharePasswordSettings } from "@/components/VideoSharePasswordSettings";
import { EmbedSnippet } from "@/components/EmbedSnippet";
import { VideoTitleEdit } from "@/components/VideoTitleEdit";
import { VideoArchiveButton } from "@/components/VideoArchiveButton";
import { VideoShareMenu } from "@/components/VideoShareMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDurationShort } from "@/lib/format-duration";

export type LibraryVideoItem = {
  id: string;
  title: string;
  status: string;
  shareSlug: string;
  transcriptStatus: string | null;
  sharePasswordHash: string | null;
  createdAt: string;
  viewers: number;
  commentCount: number;
  reactionCount: number;
  durationSeconds: number | null;
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
    <article className="video-card-loom group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {detailHref ? (
        <Link
          href={detailHref}
          prefetch
          className="relative block aspect-video w-full cursor-pointer overflow-hidden bg-gray-100 no-underline outline-offset-2 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary"
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
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-50">
              <Video className="size-12 text-gray-300" />
              <span className="text-xs font-medium text-gray-500">
                {v.status === "uploading" ? "Yükleniyor / işleniyor" : v.status}
              </span>
            </div>
          )}
          <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {v.status === "ready"
              ? formatDurationShort(v.durationSeconds)
              : "İşleniyor"}
          </span>
        </Link>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
            Geçersiz paylaşım bağlantısı
          </div>
        </div>
      )}

      <div
        className="cursor-pointer space-y-2 p-4"
        onClick={openVideoDetail}
      >
        <div className="mb-2 flex items-start gap-2">
          <Avatar size="sm" className="size-6 shrink-0 ring-0">
            {userImageUrl ? (
              <AvatarImage src={userImageUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-[9px]">
              {initials(userDisplayName)}
            </AvatarFallback>
          </Avatar>
          <div
            className="min-w-0 flex-1"
            data-card-interactive
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-semibold text-gray-900">
                {userDisplayName}
              </p>
              <span className="shrink-0 text-[10px] text-gray-400">
                {relativeTimeTr(v.createdAt)}
              </span>
            </div>
            <div className="mt-0.5">
              <VideoShareMenu
                shareSlug={v.shareSlug}
                appBaseUrl={appBaseUrl}
                status={v.status}
                hasPassword={!!v.sharePasswordHash}
              />
            </div>
          </div>
        </div>

        <div className="mb-4 min-w-0">
          <VideoTitleEdit
            videoId={v.id}
            initialTitle={v.title}
            detailHref={detailHref || undefined}
            variant="card"
          />
        </div>

        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {v.viewers}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3" aria-hidden />
            {v.commentCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Smile className="size-3" aria-hidden />
            {v.reactionCount}
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2"
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
          className="group/details rounded-lg border border-dashed border-gray-200 bg-gray-50/80 text-xs"
          data-card-interactive
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <summary className="cursor-pointer list-none px-2 py-1.5 font-medium text-gray-500 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1">
              <Settings2 className="size-3.5" />
              Şifre, embed ve transcript
            </span>
          </summary>
          <div className="space-y-3 border-t border-gray-100 p-2">
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

const SIDEBAR_STORAGE_KEY = "promptly.library.sidebarOpen";

type LibrarySidebarBodyProps = {
  onNavigate?: () => void;
};

function LibrarySidebarBody({ onNavigate }: LibrarySidebarBodyProps) {
  return (
    <>
      <div className="p-4 pb-2">
        <Link
          href="/library"
          onClick={onNavigate}
          className="-m-1 flex min-w-0 items-center gap-2 rounded-md p-1 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <div className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Video className="size-3.5" aria-hidden />
          </div>
          <span className="truncate text-[17px] font-bold tracking-tight">
            Promptly
          </span>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            nativeButton
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto w-full justify-between gap-2 border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 font-normal shadow-none hover:bg-sidebar-accent",
            )}
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Çalışma alanı
              </span>
              <span className="text-xs text-muted-foreground">Varsayılan</span>
            </div>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>Varsayılan alan</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="mx-3 bg-sidebar-border" />

      <nav
        className="flex flex-1 flex-col gap-0.5 p-3"
        aria-label="Kütüphane"
      >
        <div
          className="flex items-center gap-2 rounded-md bg-sidebar-accent px-2 py-2 text-sm font-medium text-sidebar-accent-foreground"
          aria-current="page"
        >
          <Library className="size-[18px] shrink-0 opacity-90" />
          Kütüphane
        </div>
      </nav>

      <div className="mt-auto space-y-3 p-4">
        <Button
          size="lg"
          className="h-12 w-full rounded-full font-bold shadow-md"
          type="button"
          onClick={() =>
            window.alert(
              "Video kaydetmek için macOS Promptly uygulamasıyla kayıt oluşturabilirsin.",
            )
          }
        >
          <Disc className="mr-2 size-4" />
          Video kaydet
        </Button>
      </div>
    </>
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  const [mainTab, setMainTab] = useState("videos");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMd, setIsMd] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsMd(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (v === "0") setSidebarOpen(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarOpen]);

  function toggleNav() {
    if (isMd) {
      setSidebarOpen((o) => !o);
    } else {
      setMobileDrawerOpen((o) => !o);
    }
  }

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

  const tabCountLabel =
    mainTab === "videos"
      ? `${sortedActive.length} video`
      : mainTab === "archive"
        ? `${sortedArchived.length} video`
        : "—";

  return (
    <div className="flex h-svh w-full overflow-hidden bg-muted/30 text-foreground">
      {mobileDrawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Menüyü kapat"
          onClick={() => setMobileDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 ease-out md:hidden",
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border">
          <LibrarySidebarBody onNavigate={() => setMobileDrawerOpen(false)} />
        </div>
      </aside>

      <aside
        className={cn(
          "hidden shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex",
          sidebarOpen ? "w-64" : "w-0 border-transparent",
        )}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex h-full w-64 flex-col overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border">
          <LibrarySidebarBody />
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 max-w-2xl">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 shrink-0 border-border shadow-xs"
              onClick={toggleNav}
              aria-label={
                isMd
                  ? sidebarOpen
                    ? "Kenar çubuğunu daralt"
                    : "Kenar çubuğunu aç"
                  : mobileDrawerOpen
                    ? "Menüyü kapat"
                    : "Menüyü aç"
              }
              aria-expanded={isMd ? sidebarOpen : mobileDrawerOpen}
            >
              {isMd ? (
                sidebarOpen ? (
                  <ChevronsLeft className="size-4" aria-hidden />
                ) : (
                  <ChevronsRight className="size-4" aria-hidden />
                )
              ) : (
                <Menu className="size-4" aria-hidden />
              )}
            </Button>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Kişi, başlık veya video ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-full border-border bg-background pl-10 shadow-none focus-visible:border-primary focus-visible:ring-primary/25"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Badge
              variant="secondary"
              className="hidden rounded-full px-3 py-1 text-sm font-normal sm:inline-flex"
            >
              <span className="font-semibold text-primary">
                {activeVideos.length}/{videoQuotaMax}
              </span>
              <span className="ml-1 text-muted-foreground">video</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="hidden font-semibold sm:inline-flex"
              type="button"
              onClick={() =>
                window.alert(
                  "Yükseltme ve kota paketleri yakında; şimdilik mevcut kota ile devam edebilirsin.",
                )
              }
            >
              Yükselt
            </Button>
            <LibraryNotificationsMenu />
            <LibraryUserMenu />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
          <div className="mb-8">
            <span className="text-sm text-muted-foreground">Kütüphane</span>
            <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-[22px] font-bold leading-snug tracking-tight text-foreground sm:text-3xl sm:font-extrabold">
                Videolar
              </h1>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 font-semibold shadow-none"
                  type="button"
                  onClick={() =>
                    window.alert(
                      "Klasörler yakında; şimdilik tüm videolar tek listede.",
                    )
                  }
                >
                  Yeni klasör
                </Button>
                <Button
                  size="sm"
                  className="font-semibold shadow-none"
                  type="button"
                  onClick={() =>
                    window.alert(
                      "Yeni kayıt için macOS Promptly uygulamasını kullan.",
                    )
                  }
                >
                  Yeni video
                </Button>
              </div>
            </div>
          </div>

          <Tabs
            value={mainTab}
            onValueChange={(v) => setMainTab(String(v))}
            className="flex flex-1 flex-col gap-0"
          >
            <div className="mb-8 flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
              <TabsList
                variant="line"
                className="h-auto w-full min-w-0 justify-start gap-8 rounded-none border-0 bg-transparent p-0"
              >
                <TabsTrigger
                  value="videos"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-4 text-sm font-medium text-muted-foreground shadow-none hover:text-foreground data-active:border-primary data-active:bg-transparent data-active:text-foreground data-active:shadow-none"
                >
                  Videolar
                </TabsTrigger>
                <TabsTrigger
                  value="screenshots"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-4 text-sm font-medium text-muted-foreground shadow-none hover:text-foreground data-active:border-primary data-active:bg-transparent data-active:text-foreground data-active:shadow-none"
                >
                  Ekran görüntüleri
                </TabsTrigger>
                <TabsTrigger
                  value="archive"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-4 text-sm font-medium text-muted-foreground shadow-none hover:text-foreground data-active:border-primary data-active:bg-transparent data-active:text-foreground data-active:shadow-none"
                >
                  Arşiv
                </TabsTrigger>
              </TabsList>
              <div className="pb-2 text-xs font-medium text-muted-foreground sm:pb-0">
                {tabCountLabel}
              </div>
            </div>

            <TabsContent value="videos" className="mt-0 flex-1">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-lg font-bold text-foreground">Videolar</h2>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as "date" | "title")}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-[150px] rounded-lg border-gray-200"
                    >
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
                    <SelectTrigger
                      size="sm"
                      className="w-[170px] rounded-lg border-gray-200"
                    >
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
                <Card className="border-dashed shadow-none">
                  <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <MonitorPlay className="mb-4 size-14 text-muted-foreground/40" />
                    <p className="text-base font-semibold text-foreground">
                      Henüz video yok
                    </p>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      Soldan <strong>Video kaydet</strong> veya macOS
                      uygulamasıyla kayıt oluştur.
                    </p>
                  </CardContent>
                </Card>
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

            <TabsContent value="screenshots" className="mt-0 flex-1">
              <Card className="border-dashed shadow-none">
                <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <ImageIcon className="mb-4 size-14 text-muted-foreground/40" />
                  <p className="text-base font-semibold text-foreground">
                    Ekran görüntüleri
                  </p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Tek kare yakalama yakında eklenecek.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="archive" className="mt-0 flex-1">
              {sortedArchived.length === 0 ? (
                <Card className="border-dashed shadow-none">
                  <CardContent className="px-6 py-14 text-center text-sm text-muted-foreground">
                    Arşiv boş. Videolar sekmesinden arşivleyebilirsin.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <h2 className="text-lg font-bold text-foreground">Arşiv</h2>
                  </div>
                  <VideoGrid
                    items={sortedArchived}
                    appBaseUrl={appBaseUrl}
                    archived
                    userDisplayName={userDisplayName}
                    userImageUrl={userImageUrl}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="fixed right-6 bottom-6 z-40 size-10 rounded-lg shadow-md"
          title="Yardım"
          aria-label="Yardım"
          onClick={() =>
            window.alert(
              "Promptly: kayıt için macOS uygulaması; paylaşım için video kartından menü. Sorun olursa destek kanalına yaz.",
            )
          }
        >
          <HelpCircle className="size-5 text-muted-foreground" />
        </Button>
      </main>

    </div>
  );
}
