import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { isClerkConfigured } from "@/lib/clerk-config";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/v/(.*)",
  "/desktop/connect",
  "/api/webhooks/(.*)",
  "/api/public/(.*)",
  "/api/mux/upload",
  "/api/health",
]);

const clerkProtected = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

/** Next.js 16+: `middleware` yerine `proxy` dosya kuralı (aynı davranış). */
export default function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }
  return clerkProtected(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
