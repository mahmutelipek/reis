"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Bookmark,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  CreditCard,
  FolderPlus,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  Library,
  Menu,
  MonitorPlay,
  Search,
  Settings2,
  Settings,
  Star,
  User,
  UserPlus,
  Users,
  Video,
  Eye,
  MessageCircle,
  Smile,
  X,
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
const PROMO_STORAGE_KEY = "promptly.library.promoDismissed";

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
              className="h-full w-full select-none object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
        className="flex flex-1 cursor-pointer flex-col p-4"
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
          <div
            className="min-w-0 flex-1"
            data-card-interactive
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="text-[13px] font-semibold leading-tight text-gray-900">
              {userDisplayName}
              <span className="ml-1 font-normal text-gray-500">
                · {shortRelativeTr(v.createdAt)}
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

        <div className="mb-4 min-w-0 flex-1">
          <VideoTitleEdit
            videoId={v.id}
            initialTitle={v.title}
            detailHref={detailHref || undefined}
            variant="card"
          />
        </div>

        <div className="mt-auto flex items-center gap-4 text-xs font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900">
            <Eye className="size-4" strokeWidth={2} aria-hidden />
            {v.viewers}
          </span>
          <span className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900">
            <MessageCircle className="size-4" strokeWidth={2} aria-hidden />
            {v.commentCount}
          </span>
          <span className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900">
            <Smile className="size-4" strokeWidth={2} aria-hidden />
            {v.reactionCount}
          </span>
        </div>

        <div
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3"
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
          className="group/details mt-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 text-xs"
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

function SideNavButton({
  icon: Icon,
  children,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100",
        className,
      )}
    >
      <Icon className="size-5 shrink-0 text-gray-500" strokeWidth={1.5} />
      {children}
    </button>
  );
}

type LibrarySidebarBodyProps = {
  onNavigate?: () => void;
  onRequestCollapse?: () => void;
  showCollapse?: boolean;
};

function LibrarySidebarBody({
  onNavigate,
  onRequestCollapse,
  showCollapse,
}: LibrarySidebarBodyProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [promoVisible, setPromoVisible] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(PROMO_STORAGE_KEY) === "1") {
        setPromoVisible(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function dismissPromo() {
    setPromoVisible(false);
    try {
      localStorage.setItem(PROMO_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4">
        <Link
          href="/library"
          onClick={onNavigate}
          className="flex min-w-0 cursor-pointer items-center gap-2 no-underline"
        >
          <PromptlyMark />
          <span className="truncate text-xl font-bold tracking-tight text-gray-900">
            Promptly
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-gray-500 hover:bg-gray-100"
            aria-label="Yeni klasör"
            onClick={() =>
              window.alert("Klasörler yakında; şimdilik tek liste.")
            }
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
        <div className="mx-3 mt-1 mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
            onClick={() => setWorkspaceOpen((o) => !o)}
          >
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Çalışma alanı
              </div>
              <div className="mt-0.5 text-xs text-gray-500">1 üye</div>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-gray-400 transition-transform",
                workspaceOpen && "rotate-180",
              )}
              strokeWidth={2}
            />
          </button>
          {workspaceOpen ? (
            <div className="border-t border-gray-200">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                onClick={() =>
                  window.alert("Ekip daveti yakında.")
                }
              >
                <UserPlus className="size-4 shrink-0 text-gray-500" strokeWidth={1.5} />
                Ekip davet et
              </button>
            </div>
          ) : null}
        </div>

        <nav className="flex flex-col gap-0.5 px-3" aria-label="Gezinme">
          <SideNavButton
            icon={User}
            onClick={() =>
              window.alert("«Sana özel» akışı yakında.")
            }
          >
            Sana özel
          </SideNavButton>
          <Link
            href="/library"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors"
          >
            <Library className="size-5 shrink-0" strokeWidth={2} />
            Kütüphane
          </Link>
          <SideNavButton
            icon={Calendar}
            onClick={() => window.alert("Toplantılar yakında.")}
          >
            Toplantılar
          </SideNavButton>
          <SideNavButton
            icon={Bookmark}
            onClick={() => window.alert("Sonra izle listesi yakında.")}
          >
            Sonra izle
          </SideNavButton>
          <SideNavButton
            icon={Clock}
            onClick={() => window.alert("Son öğeler yakında.")}
          >
            Son
          </SideNavButton>
          <SideNavButton
            icon={Star}
            onClick={() => window.alert("Ödül programı yakında.")}
          >
            Ücretsiz video kazan
          </SideNavButton>
          <SideNavButton
            icon={Settings}
            className="mt-2"
            onClick={() =>
              window.alert("Ayarlar: sağ üstte profil menüsünü kullan.")
            }
          >
            Kişisel ayarlar
          </SideNavButton>
        </nav>

        <div className="mt-6 px-3">
          <div className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
            Yönetim
          </div>
          <nav className="flex flex-col gap-0.5">
            <SideNavButton
              icon={LayoutDashboard}
              onClick={() => window.alert("Yönetim paneli yakında.")}
            >
              Yönet
            </SideNavButton>
            <SideNavButton
              icon={Users}
              onClick={() => window.alert("Kullanıcılar yakında.")}
            >
              Kullanıcılar
            </SideNavButton>
            <SideNavButton
              icon={Briefcase}
              onClick={() => window.alert("Çalışma alanı ayarları yakında.")}
            >
              Çalışma alanı
            </SideNavButton>
            <SideNavButton
              icon={CreditCard}
              onClick={() => window.alert("Faturalandırma yakında.")}
            >
              Faturalandırma
            </SideNavButton>
          </nav>
        </div>

        <div className="min-h-4 flex-1" />

        {promoVisible ? (
          <div className="relative mx-4 mb-4 shrink-0 overflow-hidden rounded-xl bg-primary/10 p-4">
            <button
              type="button"
              className="absolute top-2 right-2 rounded-full p-1 text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-900"
              aria-label="Kapat"
              onClick={dismissPromo}
            >
              <X className="size-4" strokeWidth={2} />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-24 items-center justify-center rounded-lg bg-gray-200">
              <Video className="size-8 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="mb-4 text-center text-[13px] leading-tight font-bold text-gray-900">
              Ekibini davet et, ekstra depolama kazan (yakında).
            </p>
            <Button
              type="button"
              className="h-9 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              onClick={() => window.alert("Ekip daveti yakında.")}
            >
              Ekip davet et
            </Button>
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 z-20 w-full border-t border-gray-100 bg-white p-4">
        <Button
          type="button"
          size="lg"
          className="h-11 w-full rounded-full bg-primary font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
          onClick={() =>
            window.alert(
              "Video kaydı için macOS Promptly uygulamasını kullan.",
            )
          }
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

  const tabCountLabel =
    mainTab === "videos"
      ? `${sortedActive.length} video`
      : mainTab === "archive"
        ? `${sortedArchived.length} video`
        : "—";

  const sidebarInner = (
    <LibrarySidebarBody
      onNavigate={() => setMobileDrawerOpen(false)}
      showCollapse={isMd}
      onRequestCollapse={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex h-svh w-screen overflow-hidden bg-white font-sans text-gray-900 antialiased">
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
            <Button
              type="button"
              className="hidden h-8 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:inline-flex"
              onClick={() =>
                window.alert(
                  "Yükseltme ve kota paketleri yakında.",
                )
              }
            >
              Yükselt
            </Button>
            <LibraryNotificationsMenu />
            <LibraryUserMenu />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-300">
          <div className="px-4 pt-8 pb-4 sm:px-8">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <nav className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span>Kütüphane</span>
                </nav>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[32px] sm:leading-none">
                  Videolar
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  onClick={() =>
                    window.alert("Klasörler yakında.")
                  }
                >
                  Yeni klasör
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    nativeButton
                    className={cn(
                      buttonVariants(),
                      "h-9 gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90",
                    )}
                  >
                    Yeni video
                    <ChevronDown className="size-4" strokeWidth={2} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() =>
                        window.alert("Kayıt için macOS uygulamasını kullan.")
                      }
                    >
                      Masaüstünden kaydet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="fixed right-6 bottom-6 z-40 size-12 rounded-full border-gray-200 bg-white text-gray-700 shadow-lg hover:bg-gray-50"
          title="Yardım"
          aria-label="Yardım"
          onClick={() =>
            window.alert(
              "Kayıt: macOS uygulaması. Paylaşım: video kartı menüsü.",
            )
          }
        >
          <HelpCircle className="size-6" strokeWidth={2} />
        </Button>
      </main>
    </div>
  );
}
