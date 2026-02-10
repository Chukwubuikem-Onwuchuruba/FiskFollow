// // // Resource: https://clerk.com/docs/nextjs/middleware#auth-middleware
// // // Copy the middleware code as it is from the above resource

// // import { authMiddleware } from "@clerk/nextjs";

// // export default authMiddleware({
// //   // An array of public routes that don't require authentication.
// //   publicRoutes: ["/api/webhook/clerk"],

// //   // An array of routes to be ignored by the authentication middleware.
// //   ignoredRoutes: ["/api/webhook/clerk"],
// // });

// // export const config = {
// //   matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
// // };

// import { clerkMiddleware } from "@clerk/nextjs/server";

// export default clerkMiddleware({
//   publicRoutes: ["/api/webhook/clerk"],
//   ignoredRoutes: ["/api/webhook/clerk"],
// });

// export const config = {
//   //   matcher: [
//   //     // Skip Next.js internals and all static files, unless found in search params
//   //     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//   //     // Always run for API routes
//   //     "/(api|trpc)(.*)",
//   //   ],
//   matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
// };

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Create route matchers for public and ignored routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook/clerk",
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
