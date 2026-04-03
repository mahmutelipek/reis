"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Sunucu verisini periyodik yeniler (işleniyor videolar için). */
export function RouterRefreshInterval({ ms = 12000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, ms);
    return () => window.clearInterval(id);
  }, [router, ms]);
  return null;
}
