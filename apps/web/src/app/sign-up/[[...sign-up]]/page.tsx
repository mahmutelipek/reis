import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-100 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
        <Link href="/" className="text-sm text-zinc-500 underline">
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
