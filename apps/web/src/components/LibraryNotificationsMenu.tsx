"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatRelativeTimeTr } from "@/lib/relative-time-tr";

type Row = {
  id: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  shareSlug: string;
};

export function LibraryNotificationsMenu() {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = (await res.json()) as { notifications?: Row[] };
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = items.filter((n) => !n.readAt).length;

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
      });
      setItems((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, readAt: new Date().toISOString() } : x,
        ),
      );
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      const now = new Date().toISOString();
      setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? now })));
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && void load()}>
      <DropdownMenuTrigger
        nativeButton
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative shrink-0",
        )}
        aria-label="Bildirimler"
      >
        <Bell className="size-5 text-muted-foreground" />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[min(70vh,420px)] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 font-semibold">
          <span>Bildirimler</span>
          {unread > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void markAllRead()}
            >
              Tümünü okundu işaretle
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Yükleniyor…
          </div>
        ) : items.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Henüz bildirim yok.
          </div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn(
                "flex cursor-pointer flex-col items-stretch gap-1 p-3",
                !n.readAt && "bg-primary/[0.06]",
              )}
              onClick={() => {
                void markRead(n.id);
                router.push(`/v/${encodeURIComponent(n.shareSlug)}`);
              }}
            >
              <span className="text-sm font-semibold text-foreground">
                {n.title}
              </span>
              {n.body ? (
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {n.body}
                </span>
              ) : null}
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTimeTr(n.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
