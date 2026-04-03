import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";

function safeInternalRedirect(raw: string | undefined): string | undefined {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

type Props = { searchParams: Promise<{ redirect_url?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  if (!isClerkConfigured()) {
    redirect("/");
  }

  const sp = await searchParams;
  const afterSign = safeInternalRedirect(sp.redirect_url);

  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-100 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl={afterSign}
        />
        <Link href="/" className="text-sm text-zinc-500 underline">
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
