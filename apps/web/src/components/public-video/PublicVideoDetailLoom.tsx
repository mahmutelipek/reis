"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Bell,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  PanelLeft,
  Scissors,
  Search,
  SmilePlus,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { PublicShareCopyButton } from "@/components/PublicShareCopyButton";
import { TrackedMuxPlayer } from "@/components/TrackedMuxPlayer";
import { VideoTranscript } from "@/components/VideoTranscript";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type PublicVideoDetailLoomProps = {
  shareSlug: string;
  playbackId: string;
  title: string;
  viewCount: number;
  uploaderName: string;
  uploaderImageUrl: string | null;
  uploaderFallback: string;
  createdRel: string;
  transcriptStatus: string | null;
  transcriptText: string | null;
  transcriptError: string | null;
};

function summaryFromTranscript(
  status: string | null,
  text: string | null,
): string {
  if (status === "ready" && text?.trim()) {
    const t = text.trim();
    return t.length > 520 ? `${t.slice(0, 517)}…` : t;
  }
  return "Transkript hazır olduğunda burada videonun metin özeti görünebilir. Şimdilik oynatıcıdan izleyerek içeriği keşfedebilirsiniz.";
}

function HeaderIconButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex size-[34px] items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export function PublicVideoDetailLoom({
  shareSlug,
  playbackId,
  title,
  viewCount,
  uploaderName,
  uploaderImageUrl,
  uploaderFallback,
  createdRel,
  transcriptStatus,
  transcriptText,
  transcriptError,
}: PublicVideoDetailLoomProps) {
  const summary = summaryFromTranscript(transcriptStatus, transcriptText);

  return (
    <div className="flex min-h-svh flex-col overflow-hidden bg-[#F9FAFB] text-gray-900">
      <header className="flex w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/library"
            className="flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Kütüphane"
            title="Kütüphane"
          >
            <PanelLeft className="size-[22px]" aria-hidden />
          </Link>
          <Link
            href="/library"
            className="flex min-w-0 cursor-pointer items-center gap-2"
          >
            <div className="flex size-[22px] shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
              <Video className="size-3.5" aria-hidden />
            </div>
            <span className="truncate text-[17px] font-bold tracking-tight">
              Promptly
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <PublicShareCopyButton layout="loom-toolbar" />
          <HeaderIconButton label="Daha fazla">
            <MoreHorizontal className="size-6" aria-hidden />
          </HeaderIconButton>
          <HeaderIconButton label="Ara">
            <Search className="size-[18px]" aria-hidden />
          </HeaderIconButton>
          <HeaderIconButton label="Bildirimler">
            <Bell className="size-[18px]" aria-hidden />
          </HeaderIconButton>
          <div className="ml-1 flex items-center">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-8 border border-gray-300",
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="flex size-8 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Giriş
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-y-auto px-8 py-10 lg:px-16 xl:px-24">
          <div className="mx-auto mb-5 flex max-w-[1000px] items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-pretty text-[22px] font-bold leading-snug text-gray-900">
                {title}
              </h1>
              <div className="mt-1.5 text-[13px] text-gray-500">
                <span className="font-medium text-gray-700">{uploaderName}</span>
                <span aria-hidden> · </span>
                <span>{createdRel}</span>
              </div>
            </div>
            <div className="ml-2 shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] font-medium text-gray-700 shadow-sm">
              {viewCount} görüntüleme
            </div>
          </div>

          <div className="relative mx-auto mb-8 max-w-[1000px]">
            <div
              className={cn(
                "relative aspect-video overflow-hidden rounded-xl border-[6px] border-[#5E5E5E] bg-black shadow-md",
              )}
            >
              <TrackedMuxPlayer
                shareSlug={shareSlug}
                playbackId={playbackId}
                title={title}
                accentColor="rgb(237 69 49)"
                className="aspect-video h-full w-full rounded-lg"
              />
              <Avatar className="pointer-events-none absolute bottom-6 left-6 z-10 size-[70px] border-4 border-white shadow-md">
                {uploaderImageUrl ? (
                  <AvatarImage
                    src={uploaderImageUrl}
                    alt=""
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-gray-200 text-sm font-semibold text-gray-700">
                  {uploaderFallback}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="mx-auto mb-8 max-w-[1000px] lg:hidden">
            <h2 className="mb-3 text-[16px] font-bold text-gray-900">
              Transkript
            </h2>
            <VideoTranscript
              variant="default"
              tone="light"
              status={transcriptStatus}
              text={transcriptText}
              error={transcriptError}
            />
          </div>

          <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
            <div className="flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              {["❤️", "👍", "🔥", "👏", "🙌", "👀"].map((e) => (
                <button
                  key={e}
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full text-[20px] transition-colors hover:bg-gray-50"
                  aria-label="Tepki"
                >
                  {e}
                </button>
              ))}
              <div
                className="mx-1 h-6 w-px self-center bg-gray-200"
                aria-hidden
              />
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-50"
                aria-label="Tepki ekle"
              >
                <SmilePlus className="size-[22px]" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[14px] font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
            >
              <MessageCircle className="size-5" aria-hidden />
              Yorum
            </button>
          </div>

          <div className="mx-auto max-w-[1000px] pb-20">
            <h2 className="mb-3 text-[16px] font-bold text-gray-900">Özet</h2>
            <p className="mb-8 max-w-[800px] text-[14px] leading-[1.6] text-gray-700">
              {summary}
            </p>

            <h2 className="mb-4 text-[16px] font-bold text-gray-900">
              Bölümler
            </h2>
            <p className="mb-10 text-[14px] text-gray-500">
              Zaman damgalı bölümler yakında eklenecek.
            </p>

            <button
              type="button"
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              # etiket ekle
            </button>
          </div>
        </div>

        <aside className="hidden w-[360px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white lg:flex">
          <Tabs defaultValue="transcript" className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 overflow-x-auto border-b border-gray-200">
              <TabsList
                variant="line"
                className="h-auto w-full min-w-0 justify-start gap-0 rounded-none bg-transparent p-0 px-2"
              >
                {(
                  [
                    ["edit", "Düzenle"],
                    ["activity", "Aktivite"],
                    ["generate", "Üret"],
                    ["transcript", "Transkript"],
                    ["settings", "Ayarlar"],
                  ] as const
                ).map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={cn(
                      "rounded-none border-0 border-b-2 border-transparent px-3 py-3 text-[13px] font-medium data-active:border-primary data-active:text-primary data-active:after:opacity-0",
                      "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pb-10">
              <TabsContent value="edit" className="m-0 flex flex-col gap-0 p-0">
                <div className="p-5">
                  <div className="group relative cursor-pointer rounded-xl border border-[#E0D4FF] bg-[#F9F7FF] p-4 transition-shadow hover:shadow-sm">
                    <div className="flex items-start justify-between gap-4 pr-8">
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-[15px] font-bold text-gray-900">
                          Promptly Pro
                          <Sparkles
                            className="size-4 text-primary"
                            aria-hidden
                          />
                        </h3>
                        <p className="mb-1.5 text-[12px] leading-snug text-gray-600">
                          Gelişmiş düzenleme ve AI özellikleri için yükselt.
                        </p>
                        <span className="text-[12px] font-medium text-primary group-hover:underline">
                          Yakında
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mx-5 h-px bg-gray-100" />
                <div className="px-5 pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-gray-900">
                      Düzenlemeler
                    </h3>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <Wand2 className="size-4" aria-hidden />
                      Otomatik
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                      <div className="flex min-w-0 items-center gap-3 pr-4">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                          <Scissors className="size-4" aria-hidden />
                        </div>
                        <span className="text-[13px] font-medium leading-snug text-gray-900">
                          Kırpma, klip ve metin katmanları (yakında)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mx-5 my-5 h-px bg-gray-100" />
                <div className="px-5">
                  <h3 className="mb-3 text-[15px] font-bold text-gray-900">
                    Aksiyon
                  </h3>
                  <div className="group flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 shadow-sm">
                        <Loader2 className="size-4 opacity-40" aria-hidden />
                      </div>
                      <span className="text-[13px] font-medium text-gray-900">
                        Belge üret (yakında)
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="activity"
                className="m-0 p-5 text-[13px] text-gray-600"
              >
                İzlenme ve etkinlik geçmişi yakında.
              </TabsContent>

              <TabsContent
                value="generate"
                className="m-0 p-5 text-[13px] text-gray-600"
              >
                Özet ve başlık üretimi yakında.
              </TabsContent>

              <TabsContent value="transcript" className="m-0 p-5">
                <VideoTranscript
                  variant="sidebar"
                  tone="light"
                  status={transcriptStatus}
                  text={transcriptText}
                  error={transcriptError}
                />
              </TabsContent>

              <TabsContent
                value="settings"
                className="m-0 p-5 text-[13px] text-gray-600"
              >
                Paylaşım ayarları kütüphanedeki kayıt sayfasından yönetilir.
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>

      <Link
        href="/library"
        className="fixed bottom-6 left-6 z-50 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        aria-label="Kütüphane"
      >
        <Video className="size-[22px]" aria-hidden />
      </Link>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-50 flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[16px] font-bold text-gray-600 shadow-md transition-colors hover:bg-gray-50"
        title="Yardım"
        aria-label="Yardım"
      >
        ?
      </button>
    </div>
  );
}
