import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import healthHandler from "./api/health.js";
import eventsHandler from "./api/jkt48-events.js";
import imageHandler from "./api/jkt48-image.js";
import memberDetailHandler from "./api/jkt48-member-detail.js";
import membersHandler from "./api/jkt48-members.js";
import quotaHandler from "./api/jkt48-quota.js";
import schedulesHandler from "./api/jkt48-schedules.js";
import stocksHandler from "./api/jkt48-stocks.js";
import theaterShowHandler from "./api/jkt48-theater-show.js";
import { getPublicError, sendJson } from "./api/_lib/jkt48.js";

const LOCAL_API_ROUTES = new Map([
  ["/api/health", healthHandler],
  ["/api/jkt48-events", eventsHandler],
  ["/api/jkt48-image", imageHandler],
  ["/api/jkt48-member-detail", memberDetailHandler],
  ["/api/jkt48-members", membersHandler],
  ["/api/jkt48-quota", quotaHandler],
  ["/api/jkt48-schedules", schedulesHandler],
  ["/api/jkt48-stocks", stocksHandler],
  ["/api/jkt48-theater-show", theaterShowHandler],
]);

function queryFromSearchParams(searchParams) {
  const query = {};

  for (const [key, value] of searchParams.entries()) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      query[key] = Array.isArray(query[key])
        ? [...query[key], value]
        : [query[key], value];
    } else {
      query[key] = value;
    }
  }

  return query;
}

function localJkt48Api() {
  return {
    name: "local-jkt48-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        let requestUrl;

        try {
          requestUrl = new URL(req.url || "/", "http://localhost");
        } catch {
          return next();
        }

        const handler = LOCAL_API_ROUTES.get(requestUrl.pathname);
        if (!handler) return next();

        req.query = queryFromSearchParams(requestUrl.searchParams);

        try {
          await handler(req, res);
        } catch (error) {
          console.error(`[LOCAL API UNHANDLED] ${requestUrl.pathname}`, error);

          if (!res.writableEnded) {
            const failure = getPublicError(
              error,
              "API lokal CEK48 mengalami gangguan.",
            );

            sendJson(res, failure.status, {
              ok: false,
              status: false,
              code: failure.code,
              error: failure.message,
              message: failure.message,
              retryable: failure.retryable,
            });
          }
        }

        return undefined;
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), localJkt48Api()],
  };
});
