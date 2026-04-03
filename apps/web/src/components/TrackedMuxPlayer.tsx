"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Props = {
  shareSlug: string;
  playbackId: string;
  title: string;
  /** Mux kontrol vurgu rengi */
  accentColor?: string;
  className?: string;
};

const STORAGE_PREFIX = "promptly_view_session:";

function getOrCreateSessionId(slug: string): string {
  if (typeof window === "undefined") return "";
  const key = STORAGE_PREFIX + slug;
  let id = window.localStorage.getItem(key);
  if (!id || id.length > 80) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

function useViewSessionId(slug: string): string {
  return useSyncExternalStore(
    () => () => {},
    () => getOrCreateSessionId(slug),
    () => "",
  );
}

async function reportView(
  shareSlug: string,
  sessionId: string,
  seconds: number,
) {
  try {
    await fetch("/api/public/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareSlug, sessionId, seconds }),
    });
  } catch {
    /* ağ hatası — sessiz */
  }
}

export function TrackedMuxPlayer({
  shareSlug,
  playbackId,
  title,
  accentColor = "rgb(59 130 246)",
  className,
}: Props) {
  const sessionId = useViewSessionId(shareSlug);
  const lastSentRef = useRef(0);
  const lastBeatRef = useRef(0);
  const openReportedRef = useRef(false);

  useEffect(() => {
    openReportedRef.current = false;
    lastSentRef.current = 0;
    lastBeatRef.current = 0;
  }, [shareSlug]);

  useEffect(() => {
    if (!sessionId || openReportedRef.current) return;
    openReportedRef.current = true;
    void reportView(shareSlug, sessionId, 0);
  }, [shareSlug, sessionId]);

  const onTimeUpdate = useCallback(
    (evt: Event) => {
      if (!sessionId) return;
      const el = evt.target as { currentTime?: number } | null;
      const raw = typeof el?.currentTime === "number" ? el.currentTime : 0;
      const seconds = Math.floor(raw);
      const now = Date.now();
      if (
        seconds > lastSentRef.current ||
        now - lastBeatRef.current > 12000
      ) {
        lastSentRef.current = Math.max(lastSentRef.current, seconds);
        lastBeatRef.current = now;
        void reportView(shareSlug, sessionId, seconds);
      }
    },
    [shareSlug, sessionId],
  );

  return (
    <MuxPlayer
      playbackId={playbackId}
      metadataVideoTitle={title}
      accentColor={accentColor}
      className={cn(
        "aspect-video w-full overflow-hidden rounded-lg bg-black",
        className,
      )}
      onTimeUpdate={onTimeUpdate}
    />
  );
}
