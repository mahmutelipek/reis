import { HomeWithClerk } from "@/components/HomeWithClerk";
import { isClerkConfigured } from "@/lib/clerk-config";

export default function Home() {
  if (!isClerkConfigured()) {
    return (
      <div className="flex min-h-svh flex-col bg-zinc-50 px-6 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <h1 className="text-3xl font-semibold tracking-tight">Promptly</h1>
        <p className="mt-6 max-w-lg text-zinc-600 dark:text-zinc-400">
          Kurulum için{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            apps/web/.env.example
          </code>{" "}
          dosyasını{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
            .env.local
          </code>{" "}
          olarak kopyalayın;{" "}
          <strong>Clerk</strong> ve <strong>DATABASE_URL</strong> anahtarlarını
          doldurun. Ardından <code className="text-sm">npm run dev</code> ile
          tam deneyim açılır.
        </p>
      </div>
    );
  }

  return <HomeWithClerk />;
}
