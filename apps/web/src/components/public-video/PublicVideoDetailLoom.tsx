"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Globe, PanelLeft, Video } from "lucide-react";
import Link from "next/link";
import { PublicShareCopyButton } from "@/components/PublicShareCopyButton";
import { TrackedMuxPlayer } from "@/components/TrackedMuxPlayer";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
};

export function PublicVideoDetailLoom({
  shareSlug,
  playbackId,
  title,
  viewCount,
  uploaderName,
  uploaderImageUrl,
  uploaderFallback,
  createdRel,
}: PublicVideoDetailLoomProps) {
  return (
    <div className="flex min-h-svh flex-col overflow-hidden bg-[#F9FAFB] text-gray-900">
      <header className="flex w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/library"
            className="flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Kütüphane"
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
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[1000px] px-6 py-8 lg:px-8">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-pretty text-[22px] font-bold leading-snug text-gray-900">
                {title}
              </h1>
              <div className="mt-1.5 text-[13px] text-gray-500">
                <span className="font-medium text-gray-700">
                  {uploaderName}
                </span>
                <span aria-hidden> · </span>
                <span>{createdRel}</span>
                <span aria-hidden> · </span>
                <span>{viewCount} görüntüleme</span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "relative mb-4 aspect-video overflow-hidden rounded-xl border-[6px] border-[#5E5E5E] bg-black shadow-md",
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
      </div>

      <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] leading-snug text-gray-600">
            <Globe className="size-4 shrink-0 text-gray-500" aria-hidden />
            <span>
              Bağlantıya sahip olanlar videoyu izleyebilir. Gelişmiş paylaşım
              (Loom benzeri sekmeler, ekip) sonra eklenecek.
            </span>
          </div>
          <PublicShareCopyButton layout="loom-footer" />
        </div>
      </footer>
    </div>
  );
}
