console.log(
  "Route handler token:",
  process.env.UPLOADTHING_TOKEN?.slice(0, 20) ?? "NOT FOUND",
);
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const runtime = "nodejs";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN ?? "",
    logLevel: "Debug",
  },
});
