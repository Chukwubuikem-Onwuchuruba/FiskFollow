import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Create route matchers for public and ignored routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook/clerk",
  "/api/uploadthing(.*)",
  // Add other public routes here
]);

const isIgnoredRoute = createRouteMatcher([
  "/api/webhook/clerk",
  // Add other ignored routes here
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's an ignored route, don't do anything
  if (isIgnoredRoute(req)) {
    return;
  }

  // If it's a public route, don't require authentication
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
