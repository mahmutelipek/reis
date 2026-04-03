"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTimeTr } from "@/lib/relative-time-tr";
import {
  isReactionKind,
  REACTION_KIND_EMOJI,
  REACTION_KINDS,
  type ReactionKind,
} from "@/lib/video-engagement";

type CommentRow = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Props = {
  shareSlug: string;
};

export function PublicVideoEngagement({ shareSlug }: Props) {
  const router = useRouter();
  const base = `/api/public/share/${encodeURIComponent(shareSlug)}`;

  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const [byKind, setByKind] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [loadingRx, setLoadingRx] = useState(true);

  const refreshComments = useCallback(async () => {
    setLoadingComments(true);
    setCommentError(null);
    try {
      const res = await fetch(`${base}/comments`, { cache: "no-store" });
      if (!res.ok) {
        setCommentError("Yorumlar yüklenemedi");
        return;
      }
      const data = (await res.json()) as { comments?: CommentRow[] };
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch {
      setCommentError("Yorumlar yüklenemedi");
    } finally {
      setLoadingComments(false);
    }
  }, [base]);

  const refreshReactions = useCallback(async () => {
    setLoadingRx(true);
    try {
      const res = await fetch(`${base}/reactions`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        byKind?: Record<string, number>;
        total?: number;
        mine?: string[];
      };
      setByKind(data.byKind ?? {});
      setMine(new Set(Array.isArray(data.mine) ? data.mine : []));
    } finally {
      setLoadingRx(false);
    }
  }, [base]);

  useEffect(() => {
    void refreshComments();
    void refreshReactions();
  }, [refreshComments, refreshReactions]);

  async function submitComment() {
    const body = draft.trim();
    if (body.length < 1) return;
    setPosting(true);
    setCommentError(null);
    try {
      const res = await fetch(`${base}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        setCommentError("Yorum için giriş yapmalısın.");
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setCommentError(j.error ?? "Gönderilemedi");
        return;
      }
      setDraft("");
      await refreshComments();
      router.refresh();
    } catch {
      setCommentError("Gönderilemedi");
    } finally {
      setPosting(false);
    }
  }

  async function toggleReaction(kind: ReactionKind) {
    try {
      const res = await fetch(`${base}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (res.status === 401) return;
      if (!res.ok) return;
      const data = (await res.json()) as { active?: boolean; kind?: string };
      const k = data.kind && isReactionKind(data.kind) ? data.kind : kind;
      setMine((prev) => {
        const next = new Set(prev);
        if (data.active) next.add(k);
        else next.delete(k);
        return next;
      });
      await refreshReactions();
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-8 pb-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div
          className="flex rounded-full border border-gray-200 bg-white p-1 shadow-sm"
          aria-busy={loadingRx}
        >
          {REACTION_KINDS.map((kind) => {
            const active = mine.has(kind);
            const count = byKind[kind] ?? 0;
            return (
              <button
                key={kind}
                type="button"
                className={cn(
                  "relative flex min-w-10 items-center justify-center gap-0.5 rounded-full px-2 py-1.5 text-[18px] transition-colors",
                  active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-gray-50",
                )}
                aria-pressed={active}
                aria-label={`${REACTION_KIND_EMOJI[kind]} tepki`}
                onClick={() => void toggleReaction(kind)}
              >
                <span>{REACTION_KIND_EMOJI[kind]}</span>
                {count > 0 ? (
                  <span className="text-[11px] font-semibold text-gray-600">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-gray-900">
          <MessageCircle className="size-5" aria-hidden />
          Yorumlar
        </h2>

        <div className="mb-4 space-y-2">
          <textarea
            className="min-h-[88px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Bir yorum yaz… (giriş gerekir)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            disabled={posting}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {draft.length}/2000
            </span>
            <Button
              type="button"
              size="sm"
              className="font-semibold"
              disabled={posting || draft.trim().length < 1}
              onClick={() => void submitComment()}
            >
              {posting ? "Gönderiliyor…" : "Gönder"}
            </Button>
          </div>
          {commentError ? (
            <p className="text-sm text-destructive">{commentError}</p>
          ) : null}
        </div>

        {loadingComments ? (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz yorum yok.</p>
        ) : (
          <ul className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {c.authorName}
                  </span>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={c.createdAt}
                  >
                    {formatRelativeTimeTr(c.createdAt)}
                  </time>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
