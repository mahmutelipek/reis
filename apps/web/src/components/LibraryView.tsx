"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Bookmark,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  FolderPlus,
  HelpCircle,
  ImageIcon,
  Library,
  Menu,
  MonitorPlay,
  Search,
  User,
  Video,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Smile,
  X,
} from "lucide-react";
import { LibraryNotificationsMenu } from "@/components/LibraryNotificationsMenu";
import { LibraryUserMenu } from "@/components/LibraryUserMenu";
import { VideoSharePasswordSettings } from "@/components/VideoSharePasswordSettings";
import { EmbedSnippet } from "@/components/EmbedSnippet";
import { VideoTitleEdit } from "@/components/VideoTitleEdit";
import { VideoShareMenu } from "@/components/VideoShareMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  videoQuotaMax?: number;
};

const SIDEBAR_STORAGE_KEY = "promptly.library.sidebarOpen";

export type LibraryNavSection =
  | "foryou"
  | "library"
  | "meetings"
  | "watchlater"
  | "recent";

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
  description: string;
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuBusy, setMenuBusy] = useState(false);

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

  async function toggleArchive() {
    setMenuBusy(true);
    try {
      const res = await fetch(`/api/videos/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !archived }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setMenuBusy(false);
    }
  }

  async function runRetranscribe() {
    setMenuBusy(true);
    try {
      await fetch(`/api/videos/${v.id}/transcribe`, { method: "POST" });
      router.refresh();
    } finally {
      setMenuBusy(false);
    }
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
        className="relative flex min-h-0 flex-1 cursor-pointer flex-col p-4"
        onClick={openVideoDetail}
      >
        <div
          className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-hover:opacity-100"
          data-card-interactive
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              nativeButton
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-8 text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              )}
              aria-label="Video seçenekleri"
            >
              <MoreHorizontal className="size-5" strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                disabled={menuBusy}
                onClick={() => void toggleArchive()}
              >
                {archived ? "Arşivden çıkar" : "Arşivle"}
              </DropdownMenuItem>
              {v.status === "ready" &&
              (v.transcriptStatus === "error" ||
                v.transcriptStatus === "skipped") ? (
                <DropdownMenuItem
                  disabled={menuBusy}
                  onClick={() => void runRetranscribe()}
                >
                  Transkripti yenile
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={() => {
                  setSettingsOpen(true);
                }}
              >
                Şifre, embed ve transcript
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-3 flex items-start gap-3">
          <Avatar className="size-8 shrink-0 rounded-full ring-0">
            {userImageUrl ? (
              <AvatarImage src={userImageUrl} alt="" className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-orange-100 text-xs font-bold text-orange-600">
              {initials(userDisplayName)}
            </AvatarFallback>
          </Avatar>
          <div
            className="min-w-0 flex-1 pr-6"
            data-card-interactive
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="text-[13px] leading-tight font-semibold text-gray-900">
              {userDisplayName}
              <span className="ml-1 font-normal text-gray-500">
                · {shortRelativeTr(v.createdAt)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <VideoShareMenu
                variant="loom"
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
            variant="loom"
          />
        </div>

        <div className="mt-auto flex items-center gap-4 text-xs font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900">
            <Eye className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {v.viewers}
          </span>
          <span className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900">
            <MessageCircle
              className="size-4 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
            {v.commentCount}
          </span>
          <span className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900">
            <Smile className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {v.reactionCount}
          </span>
        </div>
      </div>

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 sm:pt-24"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-settings-title"
          data-card-interactive
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2
                id="video-settings-title"
                className="text-base font-semibold text-gray-900"
              >
                Şifre, embed ve transcript
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label="Kapat"
                onClick={() => setSettingsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              {v.status === "ready" ? (
                <VideoSharePasswordSettings
                  videoId={v.id}
                  hasPassword={!!v.sharePasswordHash}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  Video hazır olunca şifre ve embed burada görünür.
                </p>
              )}
              {v.status === "ready" ? (
                <EmbedSnippet shareSlug={v.shareSlug} baseUrl={appBaseUrl} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

function SideNavItem({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-gray-700 hover:bg-gray-100",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          active ? "text-primary" : "text-gray-500",
        )}
        strokeWidth={active ? 2 : 1.5}
      />
      {children}
    </button>
  );
}

type LibrarySidebarBodyProps = {
  onNavigate?: () => void;
  onRequestCollapse?: () => void;
  showCollapse?: boolean;
  section: LibraryNavSection;
  onSectionChange: (s: LibraryNavSection) => void;
  onOpenRecordHint: () => void;
  onOpenFolderHint: () => void;
};

function LibrarySidebarBody({
  onNavigate,
  onRequestCollapse,
  showCollapse,
  section,
  onSectionChange,
  onOpenRecordHint,
  onOpenFolderHint,
}: LibrarySidebarBodyProps) {
  function go(s: LibraryNavSection) {
    onSectionChange(s);
    onNavigate?.();
  }

  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4">
        <button
          type="button"
          onClick={() => go("library")}
          className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left"
        >
          <PromptlyMark />
          <span className="truncate text-xl font-bold tracking-tight text-gray-900">
            Promptly
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-gray-500 hover:bg-gray-100"
            aria-label="Klasörler hakkında"
            onClick={onOpenFolderHint}
          >
            <FolderPlus className="size-5" strokeWidth={1.5} />
          </Button>
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
        <div className="mx-3 mt-1 mb-4 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">
            Çalışma alanı
          </div>
          <div className="text-xs text-gray-500">Varsayılan</div>
        </div>

        <nav className="flex flex-col gap-0.5 px-3" aria-label="Gezinme">
          <SideNavItem
            active={section === "foryou"}
            onClick={() => go("foryou")}
            icon={User}
          >
            Sana özel
          </SideNavItem>
          <SideNavItem
            active={section === "library"}
            onClick={() => go("library")}
            icon={Library}
          >
            Kütüphane
          </SideNavItem>
          <SideNavItem
            active={section === "meetings"}
            onClick={() => go("meetings")}
            icon={Calendar}
          >
            Toplantılar
          </SideNavItem>
          <SideNavItem
            active={section === "watchlater"}
            onClick={() => go("watchlater")}
            icon={Bookmark}
          >
            Sonra izle
          </SideNavItem>
          <SideNavItem
            active={section === "recent"}
            onClick={() => go("recent")}
            icon={Clock}
          >
            Son
          </SideNavItem>
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

type InfoModalKind = "folder" | "record" | "newVideo" | "help" | null;

export function LibraryView({
  activeVideos,
  archivedVideos,
  appBaseUrl,
  userDisplayName,
  userImageUrl,
  videoQuotaMax = 25,
}: Props) {
  const [section, setSection] = useState<LibraryNavSection>("library");
  const [infoModal, setInfoModal] = useState<InfoModalKind>(null);
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

  function toggleMobileNav() {
    setMobileDrawerOpen((o) => !o);
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

  const sortedRecent = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = activeVideos
      .filter((v) => (q ? v.title.toLowerCase().includes(q) : true))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return list.slice(0, 24);
  }, [activeVideos, search]);

  const tabCountLabel =
    mainTab === "videos"
      ? `${sortedActive.length} video`
      : mainTab === "archive"
        ? `${sortedArchived.length} video`
        : "—";

  const libraryPageTitle =
    mainTab === "videos"
      ? "Videolar"
      : mainTab === "screenshots"
        ? "Ekran görüntüleri"
        : "Arşiv";

  const sidebarInner = (
    <LibrarySidebarBody
      section={section}
      onSectionChange={setSection}
      onNavigate={() => setMobileDrawerOpen(false)}
      showCollapse={isMd}
      onRequestCollapse={() => setSidebarOpen(false)}
      onOpenRecordHint={() => setInfoModal("record")}
      onOpenFolderHint={() => setInfoModal("folder")}
    />
  );

  const infoModalContent =
    infoModal === "folder"
      ? {
          title: "Klasörler",
          body: (
            <p>
              MVP sürümünde tüm videolar tek listede. Klasörler ileride
              eklenecek.
            </p>
          ),
        }
      : infoModal === "record" || infoModal === "newVideo"
        ? {
            title: "Video kaydet",
            body: (
              <p>
                Kayıt için macOS Promptly uygulamasını kullan. Web arayüzünden
                yükleme şu an yok.
              </p>
            ),
          }
        : infoModal === "help"
          ? {
              title: "Yardım",
              body: (
                <p>
                  Kayıt: macOS uygulaması. Paylaşım ve şifre: video kartındaki
                  menü.
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
                placeholder="Kişi, etiket, klasör veya video ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-full border border-gray-300 bg-white pl-10 pr-4 text-sm shadow-none placeholder:text-gray-500 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 pl-2 sm:gap-4 sm:pl-4">
            <div className="hidden rounded-full bg-primary/10 px-3.5 py-1.5 text-[13px] font-semibold text-primary sm:block">
              {activeVideos.length}/{videoQuotaMax} video
            </div>
            <LibraryNotificationsMenu />
            <LibraryUserMenu />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-300">
          {section === "library" ? (
            <>
          <div className="px-4 pt-8 pb-4 sm:px-8">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <nav className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span>Kütüphane</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[32px] sm:leading-none">
                  {libraryPageTitle}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  onClick={() => setInfoModal("folder")}
                >
                  Yeni klasör
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                  onClick={() => setInfoModal("newVideo")}
                >
                  Yeni video
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setMainTab("videos")}
                  className={cn(
                    "-mb-px border-b-2 py-3 text-sm font-semibold transition-colors",
                    mainTab === "videos"
                      ? "border-primary text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900",
                  )}
                >
                  Videolar
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab("screenshots")}
                  className={cn(
                    "-mb-px border-b-2 py-3 text-sm font-semibold transition-colors",
                    mainTab === "screenshots"
                      ? "border-primary text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900",
                  )}
                >
                  Ekran görüntüleri
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab("archive")}
                  className={cn(
                    "-mb-px border-b-2 py-3 text-sm font-semibold transition-colors",
                    mainTab === "archive"
                      ? "border-primary text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900",
                  )}
                >
                  Arşiv
                </button>
              </div>
              <div className="pb-2 text-sm font-medium text-gray-500 sm:pb-0">
                {tabCountLabel}
              </div>
            </div>
          </div>

          {mainTab === "videos" ? (
            <>
              <div className="flex flex-col justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-8">
                <h2 className="text-lg font-semibold text-gray-900">
                  Videolar
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as "date" | "title")}
                  >
                    <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-300 bg-white text-sm font-medium shadow-sm">
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
                    <SelectTrigger className="h-9 w-[180px] rounded-lg border-gray-300 bg-white text-sm font-medium shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Yeniden eskiye</SelectItem>
                      <SelectItem value="old">Eskiden yeniye</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="px-4 pb-12 sm:px-8">
                {sortedActive.length === 0 ? (
                  <Card className="border-dashed border-gray-200 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <MonitorPlay className="mb-4 size-14 text-gray-300" />
                      <p className="text-base font-semibold text-gray-900">
                        Henüz video yok
                      </p>
                      <p className="mt-2 max-w-md text-sm text-gray-500">
                        Alttaki <strong>Video kaydet</strong> ile veya macOS
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
              </div>
            </>
          ) : null}

          {mainTab === "screenshots" ? (
            <div className="px-4 pb-12 sm:px-8">
              <Card className="border-dashed border-gray-200 shadow-none">
                <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <ImageIcon className="mb-4 size-14 text-gray-300" />
                  <p className="text-base font-semibold text-gray-900">
                    Ekran görüntüleri
                  </p>
                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Tek kare yakında eklenecek.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {mainTab === "archive" ? (
            <div className="px-4 pb-12 sm:px-8">
              {sortedArchived.length === 0 ? (
                <Card className="border-dashed border-gray-200 shadow-none">
                  <CardContent className="px-6 py-14 text-center text-sm text-gray-500">
                    Arşiv boş. Videolar sekmesinden arşivleyebilirsin.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Arşiv
                    </h2>
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
            </div>
          ) : null}
            </>
          ) : null}

          {section === "recent" ? (
            <>
              <div className="px-4 pt-8 pb-4 sm:px-8">
                <nav className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span>Son</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[32px] sm:leading-none">
                  Son videolar
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  En yeni 24 kayıt. Arama kutusu bu listeyi filtreler.
                </p>
              </div>
              <div className="px-4 pb-12 sm:px-8">
                {sortedRecent.length === 0 ? (
                  <MvpEmptyCard
                    icon={Clock}
                    title="Henüz kayıt yok"
                    description="Kütüphanede video oluşturduğunda burada en yenileri görünür."
                  />
                ) : (
                  <VideoGrid
                    items={sortedRecent}
                    appBaseUrl={appBaseUrl}
                    archived={false}
                    userDisplayName={userDisplayName}
                    userImageUrl={userImageUrl}
                  />
                )}
              </div>
            </>
          ) : null}

          {section === "foryou" ? (
            <div className="px-4 pt-8 pb-12 sm:px-8">
              <nav className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                <span>Sana özel</span>
              </nav>
              <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-[32px] sm:leading-none">
                Sana özel
              </h1>
              <MvpEmptyCard
                icon={User}
                title="Öneriler yakında"
                description="İzleme alışkanlıklarına göre öneriler bu alanda olacak. MVP’de sadece kütüphanen var."
              />
            </div>
          ) : null}

          {section === "meetings" ? (
            <div className="px-4 pt-8 pb-12 sm:px-8">
              <nav className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                <span>Toplantılar</span>
              </nav>
              <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-[32px] sm:leading-none">
                Toplantılar
              </h1>
              <MvpEmptyCard
                icon={Calendar}
                title="Toplantı kayıtları yok"
                description="Takvim ve toplantı entegrasyonu sonraki sürümlerde. Şimdilik videoları kütüphaneden yönet."
              />
            </div>
          ) : null}

          {section === "watchlater" ? (
            <div className="px-4 pt-8 pb-12 sm:px-8">
              <nav className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                <span>Sonra izle</span>
              </nav>
              <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-[32px] sm:leading-none">
                Sonra izle
              </h1>
              <MvpEmptyCard
                icon={Bookmark}
                title="Liste boş"
                description="Sonra izle listesi MVP kapsamında yok. Videoların hepsi kütüphanede."
              />
            </div>
          ) : null}
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
