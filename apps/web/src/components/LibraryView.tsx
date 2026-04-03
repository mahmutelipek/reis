"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type MouseEvent } from "react";
import {
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  CreditCard,
  Disc,
  Gift,
  History,
  ImageIcon,
  Library,
  LineChart,
  Link2,
  MonitorPlay,
  Search,
  Settings2,
  Star,
  UserPlus,
  Users,
  Video,
  Eye,
  MessageCircle,
  Smile,
  Clock,
} from "lucide-react";
import { LibraryUserMenu } from "@/components/LibraryUserMenu";
import { RetranscribeButton } from "@/components/RetranscribeButton";
import { VideoSharePasswordSettings } from "@/components/VideoSharePasswordSettings";
import { EmbedSnippet } from "@/components/EmbedSnippet";
import { VideoTitleEdit } from "@/components/VideoTitleEdit";
import { VideoArchiveButton } from "@/components/VideoArchiveButton";
import { VideoShareMenu } from "@/components/VideoShareMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    <article className="video-card-loom group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)]">
      {detailHref ? (
        <Link
          href={detailHref}
          prefetch
          className="relative block aspect-video w-full cursor-pointer overflow-hidden bg-gray-100 no-underline outline-offset-2 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-blue-500"
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
            {v.status === "ready" ? "Video" : "İşleniyor"}
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
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Avatar size="sm" className="size-6 shrink-0 ring-0">
              {userImageUrl ? (
                <AvatarImage src={userImageUrl} alt="" />
              ) : null}
              <AvatarFallback className="text-[9px]">
                {initials(userDisplayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-900">
                {userDisplayName}
              </p>
              <p className="text-[10px] text-gray-500">
                {v.sharePasswordHash ? "Şifre korumalı" : "Herkese açık"}
              </p>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-1"
            data-card-interactive
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] text-gray-400">
              {relativeTimeTr(v.createdAt)}
            </span>
            <VideoShareMenu
              shareSlug={v.shareSlug}
              appBaseUrl={appBaseUrl}
              status={v.status}
              hasPassword={!!v.sharePasswordHash}
            />
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

        <div className="flex items-center gap-4 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {v.viewers}
          </span>
          <span className="inline-flex items-center gap-1 opacity-70">
            <MessageCircle className="size-3" aria-hidden />0
          </span>
          <span className="inline-flex items-center gap-1 opacity-70">
            <Smile className="size-3" aria-hidden />0
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

  const navInactive =
    "flex items-center gap-3 rounded-lg p-2 text-sm text-gray-600 hover:bg-gray-100";
  const navDisabled =
    "flex cursor-not-allowed items-center gap-3 rounded-lg p-2 text-sm text-gray-400 opacity-60";

  return (
    <div className="flex h-svh w-full overflow-hidden bg-white text-gray-800">
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-200 md:flex [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
        <div className="mb-4 flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              P
            </div>
            <span className="text-lg font-bold tracking-tight">Promptly</span>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            aria-label="Kenar çubuğu (yakında)"
            disabled
          >
            <span className="sr-only">Daralt</span>
            <span className="text-lg" aria-hidden>
              ≡
            </span>
          </button>
        </div>

        <div className="mb-6 px-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              nativeButton
              className="flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left hover:bg-gray-100"
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  Çalışma alanı
                </span>
                <span className="text-xs text-gray-500">1 üye</span>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem>Varsayılan alan</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            className="mt-2 flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm text-gray-600 hover:bg-gray-100"
            disabled
          >
            <UserPlus className="size-3.5 shrink-0" />
            Ekip davet et
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          <div className={navDisabled}>
            <Star className="size-5 shrink-0 opacity-70" />
            Senin için
          </div>
          <div className="flex items-center gap-3 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-2 text-sm font-medium text-blue-600">
            <Library className="size-5 shrink-0" />
            Kütüphane
          </div>
          <div className={navDisabled}>
            <Calendar className="size-5 shrink-0" />
            Toplantılar
          </div>
          <div className={navDisabled}>
            <Clock className="size-5 shrink-0" />
            Sonra izle
          </div>
          <div className={navDisabled}>
            <History className="size-5 shrink-0" />
            Son açılanlar
          </div>
          <div className={navDisabled}>
            <Gift className="size-5 shrink-0" />
            Bonus
          </div>
          <Link href="/desktop/token" className={navInactive}>
            <Link2 className="size-5 shrink-0" />
            Masaüstü yedek
          </Link>
          <div className={navDisabled}>
            <Settings2 className="size-5 shrink-0" />
            Kişisel ayarlar
          </div>

          <div className="pt-6 pb-2">
            <p className="px-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Yönetim
            </p>
          </div>
          <div className={navDisabled}>
            <LineChart className="size-5 shrink-0" />
            Yönetim
          </div>
          <div className={navDisabled}>
            <Users className="size-5 shrink-0" />
            Kullanıcılar
          </div>
          <div className={navDisabled}>
            <Briefcase className="size-5 shrink-0" />
            Çalışma alanı
          </div>
          <div className={navDisabled}>
            <CreditCard className="size-5 shrink-0" />
            Faturalandırma
          </div>
        </nav>

        <div className="mt-auto space-y-4 p-4">
          <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="pr-6 text-sm font-semibold text-gray-800">
              Ekibini davet et — ortak kütüphane yakında.
            </p>
            <Button
              size="sm"
              className="mt-3 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
              disabled
            >
              Davet gönder
            </Button>
          </div>
          <Button
            className="h-12 w-full rounded-full bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700"
            type="button"
            onClick={() =>
              window.alert(
                "Kayıt: macOS Promptly uygulamasını açın. «E-posta ile giriş yap» ile Clerk oturumu; gerekirse web’de Masaüstü yedek jeton.",
              )
            }
          >
            <Disc className="mr-2 size-4" />
            Video kaydet
          </Button>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-gray-100 px-4 sm:px-8">
          <div className="min-w-0 flex-1 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Kişi, başlık veya video ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-full border-gray-200 bg-white pl-10 shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500 sm:flex">
              <span className="font-semibold text-blue-600">
                {activeVideos.length}/{videoQuotaMax}
              </span>
              <span>video</span>
            </div>
            <Button
              size="sm"
              className="hidden font-bold text-white sm:inline-flex bg-blue-600 hover:bg-blue-700 lg:inline-flex"
              disabled
            >
              Yükselt
            </Button>
            <button
              type="button"
              className="relative hidden text-gray-500 sm:block"
              disabled
              aria-label="Bildirimler"
            >
              <Bell className="size-5" />
              <span className="absolute top-0 right-0 size-2 rounded-full border-2 border-white bg-red-500" />
            </button>
            <LibraryUserMenu />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
          <div className="mb-8">
            <span className="text-sm text-gray-500">Kütüphane</span>
            <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Videolar
              </h1>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 font-semibold"
                  disabled
                >
                  Yeni klasör
                </Button>
                <DropdownMenu>
                  <div className="inline-flex rounded-lg shadow-sm">
                    <Button
                      size="sm"
                      className="rounded-r-none border-r border-blue-500 bg-blue-600 font-semibold text-white hover:bg-blue-700"
                      type="button"
                      onClick={() =>
                        window.alert(
                          "macOS Promptly: «E-posta ile giriş yap» → kayıt al. Yedek: /desktop/token.",
                        )
                      }
                    >
                      Yeni video
                    </Button>
                    <DropdownMenuTrigger
                      nativeButton
                      className="inline-flex items-center justify-center rounded-r-lg bg-blue-600 px-2.5 text-white hover:bg-blue-700"
                    >
                      <ChevronDown className="size-4" />
                    </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() =>
                        window.alert(
                          "Masaüstü: Xcode + promptly URL şeması. Sunucu PromptlyConfig.",
                        )
                      }
                    >
                      Masaüstü kurulumu
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-4 text-sm font-medium text-gray-500 shadow-none hover:text-gray-700 data-active:border-blue-600 data-active:bg-transparent data-active:text-gray-900 data-active:shadow-none"
                >
                  Videolar
                </TabsTrigger>
                <TabsTrigger
                  value="screenshots"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-4 text-sm font-medium text-gray-500 shadow-none hover:text-gray-700 data-active:border-blue-600 data-active:bg-transparent data-active:text-gray-900 data-active:shadow-none"
                >
                  Ekran görüntüleri
                </TabsTrigger>
                <TabsTrigger
                  value="archive"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-4 text-sm font-medium text-gray-500 shadow-none hover:text-gray-700 data-active:border-blue-600 data-active:bg-transparent data-active:text-gray-900 data-active:shadow-none"
                >
                  Arşiv
                </TabsTrigger>
              </TabsList>
              <div className="pb-2 text-xs font-medium text-gray-500 sm:pb-0">
                {tabCountLabel}
              </div>
            </div>

            <TabsContent value="videos" className="mt-0 flex-1">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-lg font-bold text-gray-900">Videolar</h2>
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
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-20 text-center">
                  <MonitorPlay className="mb-4 size-14 text-gray-300" />
                  <p className="text-base font-semibold text-gray-900">
                    Henüz video yok
                  </p>
                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Soldan <strong>Video kaydet</strong> veya macOS uygulamasıyla
                    kayıt oluşturun.
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

            <TabsContent value="screenshots" className="mt-0 flex-1">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-20 text-center">
                <ImageIcon className="mb-4 size-14 text-gray-300" />
                <p className="text-base font-semibold text-gray-900">
                  Ekran görüntüleri
                </p>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  Yakında tek kare yakalama.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="archive" className="mt-0 flex-1">
              {sortedArchived.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-16 text-center text-sm text-gray-500">
                  Arşiv boş. Videolar sekmesinden arşivleyin.
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <h2 className="text-lg font-bold text-gray-900">Arşiv</h2>
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

        <button
          type="button"
          className="fixed right-6 bottom-6 z-40 flex size-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-lg hover:bg-gray-50"
          title="Yardım"
          aria-label="Yardım"
        >
          <span className="text-lg text-gray-600">?</span>
        </button>
      </main>

    </div>
  );
}
