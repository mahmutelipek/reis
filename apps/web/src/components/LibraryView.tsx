"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  Library,
  Menu,
  MonitorPlay,
  Search,
  Video,
  X,
} from "lucide-react";
import { LibraryNotificationsMenu } from "@/components/LibraryNotificationsMenu";
import { LibraryUserMenu } from "@/components/LibraryUserMenu";
import { VideoTitleEdit } from "@/components/VideoTitleEdit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDurationShort } from "@/lib/format-duration";

export type LibraryVideoItem = {
  id: string;
  title: string;
  status: string;
  shareSlug: string;
  createdAt: string;
  durationSeconds: number | null;
  muxPlaybackId: string | null;
};

type Props = {
  videos: LibraryVideoItem[];
  userDisplayName: string;
  userImageUrl: string | null;
  videoQuotaMax?: number;
};

const SIDEBAR_STORAGE_KEY = "promptly.library.sidebarOpen";

function InfoModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border pb-4">
          <CardTitle id="info-modal-title" className="text-base">
            {title}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Kapat"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

function MvpEmptyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-gray-200 shadow-none">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <Icon className="mb-4 size-14 text-muted-foreground/40" strokeWidth={1.25} />
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="mt-2 max-w-md text-pretty">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function shortRelativeTr(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "Az önce";
  if (sec < 3600) return `${Math.floor(sec / 60)} dk`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} sa`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} gün`;
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

function PromptlyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8 shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 8C16 12.4183 12.4183 16 8 16C12.4183 16 16 19.5817 16 24C16 19.5817 19.5817 16 24 16C19.5817 16 16 12.4183 16 8Z"
        fill="white"
      />
    </svg>
  );
}

function VideoCardLoom({
  v,
  userDisplayName,
  userImageUrl,
}: {
  v: LibraryVideoItem;
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
    <article className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {detailHref ? (
        <Link
          href={detailHref}
          prefetch
          className="relative block aspect-[16/10] w-full cursor-pointer overflow-hidden border-b border-gray-200 bg-gray-200 no-underline outline-offset-2 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`${v.title} — videoyu aç`}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-50">
              <Video className="size-12 text-gray-300" />
              <span className="text-xs font-medium text-gray-500">
                {v.status === "uploading" ? "Yükleniyor" : v.status}
              </span>
            </div>
          )}
          <span className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-gray-900/80 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
            {v.status === "ready"
              ? formatDurationShort(v.durationSeconds)
              : "İşleniyor"}
          </span>
        </Link>
      ) : (
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-gray-200 bg-gray-200">
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
            Geçersiz bağlantı
          </div>
        </div>
      )}

      <div
        className="relative flex min-h-0 flex-1 cursor-pointer flex-col p-4 pb-5"
        onClick={openVideoDetail}
      >
        <div className="mb-3 flex items-start gap-3">
          <Avatar className="size-8 shrink-0 rounded-full ring-0">
            {userImageUrl ? (
              <AvatarImage src={userImageUrl} alt="" className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-orange-100 text-xs font-bold text-orange-600">
              {initials(userDisplayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] leading-tight font-semibold text-gray-900">
              {userDisplayName}
              <span className="ml-1 font-normal text-gray-500">
                · {shortRelativeTr(v.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0" data-card-interactive onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <VideoTitleEdit
            videoId={v.id}
            initialTitle={v.title}
            detailHref={detailHref || undefined}
            variant="loom"
          />
        </div>
      </div>
    </article>
  );
}

function VideoGrid({
  items,
  userDisplayName,
  userImageUrl,
}: {
  items: LibraryVideoItem[];
  userDisplayName: string;
  userImageUrl: string | null;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((v) => (
        <VideoCardLoom
          key={v.id}
          v={v}
          userDisplayName={userDisplayName}
          userImageUrl={userImageUrl}
        />
      ))}
    </div>
  );
}

type LibrarySidebarBodyProps = {
  onNavigate?: () => void;
  onRequestCollapse?: () => void;
  showCollapse?: boolean;
  onOpenRecordHint: () => void;
};

function LibrarySidebarBody({
  onNavigate,
  onRequestCollapse,
  showCollapse,
  onOpenRecordHint,
}: LibrarySidebarBodyProps) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4">
        <Link
          href="/library"
          onClick={onNavigate}
          className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left no-underline"
        >
          <PromptlyMark />
          <span className="truncate text-xl font-bold tracking-tight text-gray-900">
            Promptly
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          {showCollapse && onRequestCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden size-8 text-gray-500 hover:bg-gray-100 md:flex"
              aria-label="Kenar çubuğunu daralt"
              onClick={onRequestCollapse}
            >
              <ChevronsLeft className="size-5" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pb-28 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-300">
        <nav className="mt-1 flex flex-col gap-0.5 px-3" aria-label="Gezinme">
          <Link
            href="/library"
            onClick={onNavigate}
            className="flex w-full items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary no-underline transition-colors"
          >
            <Library className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            Kütüphane
          </Link>
        </nav>
        <div className="min-h-4 flex-1" />
      </div>

      <div className="absolute bottom-0 left-0 z-20 w-full border-t border-gray-100 bg-white p-4">
        <Button
          type="button"
          size="lg"
          className="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
          onClick={onOpenRecordHint}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="mr-2 size-5"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 4C12 8.41828 8.41828 12 4 12C8.41828 12 12 15.5817 12 20C12 15.5817 15.5817 12 20 12C15.5817 12 12 8.41828 12 4Z"
              fill="white"
            />
          </svg>
          Video kaydet
        </Button>
      </div>
    </>
  );
}

type InfoModalKind = "record" | "help" | null;

export function LibraryView({
  videos,
  userDisplayName,
  userImageUrl,
  videoQuotaMax = 25,
}: Props) {
  const [infoModal, setInfoModal] = useState<InfoModalKind>(null);
  const [search, setSearch] = useState("");
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

  function toggleMobileNav() {
    setMobileDrawerOpen((o) => !o);
  }

  const sortedVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...videos]
      .filter((v) => (q ? v.title.toLowerCase().includes(q) : true))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [videos, search]);

  const sidebarInner = (
    <LibrarySidebarBody
      onNavigate={() => setMobileDrawerOpen(false)}
      showCollapse={isMd}
      onRequestCollapse={() => setSidebarOpen(false)}
      onOpenRecordHint={() => setInfoModal("record")}
    />
  );

  const infoModalContent =
    infoModal === "record"
      ? {
          title: "Video kaydet",
          body: (
            <p>
              Önce macOS Promptly uygulamasıyla kayıt al; videolar burada
              listelenir. Paylaşım bağlantısı video sayfasından kopyalanır.
            </p>
          ),
        }
      : infoModal === "help"
        ? {
            title: "Yardım",
            body: (
              <p>
                Kayıt: macOS uygulaması. Paylaşım: videoyu açıp bağlantıyı
                kopyala.
              </p>
            ),
          }
        : null;

  return (
    <div className="flex h-svh w-screen overflow-hidden bg-white font-sans text-gray-900 antialiased">
      {infoModalContent ? (
        <InfoModal
          open
          onClose={() => setInfoModal(null)}
          title={infoModalContent.title}
        >
          {infoModalContent.body}
        </InfoModal>
      ) : null}

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
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out md:hidden",
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="relative flex h-full flex-col">{sidebarInner}</div>
      </aside>

      <aside
        className={cn(
          "relative z-10 hidden h-full shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-out md:flex",
          sidebarOpen ? "w-[260px]" : "w-0 border-transparent",
        )}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex h-full w-[260px] flex-col">{sidebarInner}</div>
      </aside>

      {!sidebarOpen && isMd ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute top-4 left-2 z-20 hidden size-9 shadow-sm md:flex"
          aria-label="Kenar çubuğunu aç"
          onClick={() => setSidebarOpen(true)}
        >
          <ChevronsRight className="size-4" />
        </Button>
      ) : null}

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex shrink-0 md:w-0 md:overflow-hidden md:opacity-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-gray-600 md:hidden"
              aria-label="Menüyü aç"
              onClick={toggleMobileNav}
            >
              <Menu className="size-5" />
            </Button>
          </div>

          <div className="mx-auto flex w-full max-w-xl flex-1 justify-center px-2">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="size-4 text-gray-500" strokeWidth={2} />
              </div>
              <Input
                type="search"
                placeholder="Video ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-full border border-gray-300 bg-white pl-10 pr-4 text-sm shadow-none placeholder:text-gray-500 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 pl-2 sm:gap-4 sm:pl-4">
            <div className="hidden rounded-full bg-primary/10 px-3.5 py-1.5 text-[13px] font-semibold text-primary sm:block">
              {videos.length}/{videoQuotaMax} video
            </div>
            <LibraryNotificationsMenu />
            <LibraryUserMenu />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-300">
          <div className="px-4 pt-8 pb-6 sm:px-8">
            <nav className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
              <span>Videolar</span>
            </nav>
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[32px] sm:leading-none">
                Kayıtlarım
              </h1>
              <p className="text-sm text-muted-foreground">
                {sortedVideos.length} video
                {search.trim() ? " (filtreli)" : ""}
              </p>
            </div>
          </div>

          <div className="px-4 pb-12 sm:px-8">
            {sortedVideos.length === 0 ? (
              <MvpEmptyCard
                icon={MonitorPlay}
                title="Henüz video yok"
                description={
                  <>
                    Kenar çubuğundaki{" "}
                    <strong className="font-semibold text-foreground">
                      Video kaydet
                    </strong>{" "}
                    ile macOS uygulamasından kayıt başlat; hazır olunca burada
                    görünür.
                  </>
                }
              />
            ) : (
              <VideoGrid
                items={sortedVideos}
                userDisplayName={userDisplayName}
                userImageUrl={userImageUrl}
              />
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="fixed right-6 bottom-6 z-40 size-12 rounded-full border-gray-200 bg-white text-gray-700 shadow-lg hover:bg-gray-50"
          title="Yardım"
          aria-label="Yardım"
          onClick={() => setInfoModal("help")}
        >
          <HelpCircle className="size-6" strokeWidth={2} />
        </Button>
      </main>
    </div>
  );
}
