import { sendJson } from "./_lib/jkt48.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  return sendJson(res, 200, {
    ok: true,
    app: "CEK48",
    version: "5.4.0",
    timestamp: new Date().toISOString(),
    services: {
      coreApi: true,
    },
  });
}
